import { usersModel } from "../models/users";
import { Prisma } from "../generated/prisma/client";
import { IQueryPagination } from "../models/services";
import { ICreateParceiro, IUpdateParceiro } from "../routers/users";
import { EnumRoles } from "./middlewares/validate-role";
import { authService } from "./auth";
import { pagarmeApi } from "./pagarme/api";
import { notificationsService, EnumNotificationType } from "./notifications";

async function getAll(query?: IQueryPagination) {
  return await usersModel.getAll(query);
}

async function getById(id: number) {
  const user = await usersModel.getById(Number(id));

  if (!user)
    throw new Error("Não foi possível encontrar o usuário solicitado.");

  return user;
}

async function getMe(id: number) {
  const user = await usersModel.getById(Number(id));

  if (!user)
    throw new Error("Não foi possível as informações do usuário solicitado.");

  return user;
}

async function deleteUser(id: number) {
  const user = await getById(id);

  if(user.role === EnumRoles.admin) throw new Error("Não foi possível deletar este usuário.");

  return await usersModel.delete(id);
}

async function create(payload: ICreateParceiro) {
  const unmaskedCnpj = payload.metadata.cnpj.replace(/\D/g, "");

  const data: Prisma.usersCreateInput = {
    ...payload,
    password: authService.hashPassword(unmaskedCnpj),
    role: EnumRoles.parceiro
  };

  const user = await usersModel.create(data);

  notificationsService.create({
    title: "Novo parceiro cadastrado",
    body: `${payload.name} (${payload.email}) cadastrado.`,
    type: EnumNotificationType.info,
    user_id: user.id,
  }).catch(() => {});

  return user;
}

async function update(id: number, payload: IUpdateParceiro) {
  const user = await getById(id);

  const data: Prisma.usersUpdateInput = {
    name: payload.name ?? user.name,
    email: payload.email ?? user.email,
    pagarme_id: payload.pagarme_id ?? user.pagarme_id ?? null,
    metadata: {
      cnpj: payload.metadata?.cnpj ?? (user.metadata as any).cnpj,
      whatsapp: payload.metadata?.whatsapp ?? (user.metadata as any).whatsapp,
      cep: payload.metadata?.cep ?? (user.metadata as any).cep,
      rua: payload.metadata?.rua ?? (user.metadata as any).rua,
      numero: payload.metadata?.numero ?? (user.metadata as any).numero,
      bairro: payload.metadata?.bairro ?? (user.metadata as any).bairro,
      cidade: payload.metadata?.cidade ?? (user.metadata as any).cidade,
      estado: payload.metadata?.estado ?? (user.metadata as any).estado,
    },
  };

  if(payload.metadata?.cnpj) {
    const unmaskedCnpj = payload.metadata.cnpj.replace(/\D/g, "");
    data.password = authService.hashPassword(unmaskedCnpj)
  }

  return usersModel.update({ id, data });
}

async function getByWhatsapp(whatsapp: string) {
  const normalized = whatsapp.replace(/\D/g, "");
  return usersModel.getByWhatsapp(normalized);
}


export const usersService = {
  getAll,
  getById,
  getMe,
  delete: deleteUser,
  create,
  update,
  getByWhatsapp,
};
