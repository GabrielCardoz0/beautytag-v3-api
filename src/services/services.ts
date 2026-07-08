import { Prisma } from "../generated/prisma/client";
import { IQueryPagination, servicesModel } from "../models/services";
import { EnumRoles } from "./middlewares/validate-role";


async function getAll(query?: IQueryPagination) {
  return await servicesModel.getAll(query);
}

async function getById(id: number) {
  const service = await servicesModel.getById(Number(id));

  if(!service) throw new Error("Não foi possível encontrar o serviço solicitado.");

  return service;
}

async function assertAdminService(id: number) {
  const service = await getById(id);

  if(service.created_by !== EnumRoles.admin) throw new Error("Este serviço foi cadastrado por um parceiro e não pode ser usado em planos.");

  return service;
}

async function get(user: { role: string, id: number }, query?: IQueryPagination) {
  if(user.role === EnumRoles.admin) {
    return servicesModel.getAll(query);
  } else {
    return servicesModel.get(user.id, query);
  }
}

async function deleteService(user: { role: string, id: number }, service_id: number) {
  if(user.role === EnumRoles.admin) {
    return servicesModel.delete(service_id);
  }

  const service = await getById(service_id);

  if(service.user_id !== user.id) throw new Error("Você não ter permissão para alterar este serviço.");

  return await servicesModel.delete(service_id);
}

async function create(user: { id: number, role: string }, payload: Prisma.servicesCreateInput & { user_id?: number, created_by?: string }) {

  const userId = payload.user_id ?? user.id;

  delete payload.user_id;
  delete payload.created_by;

  const isAdmin = user.role === EnumRoles.admin;

  if(!isAdmin && userId !== user.id) throw new Error("Você não tem permissão para criar serviços para outro usuário.");

  const data: Prisma.servicesCreateInput = {
    ...payload,
    user: {
      connect: {
        id: userId
      }
    }
  }

  data.is_complete = isAdmin;
  data.created_by = isAdmin ? EnumRoles.admin : EnumRoles.parceiro;

  if(!isAdmin) {
    data.percent_tax = 0;
    data.lucro = 0;
  }

  return servicesModel.create(data);
}

async function update(user: { role: string, id: number }, service_id: number, payload: Prisma.servicesUpdateInput) {
  const service = await getById(service_id);

  if(user.role === EnumRoles.admin) {
    return servicesModel.update(service_id, payload);
  }

  payload.is_complete = service.is_complete;
  payload.created_by = service.created_by;
  payload.percent_tax = 0;
  payload.lucro = 0;

  if(service.user_id !== user.id) throw new Error("Você não ter permissão para alterar este serviço.");

  return await servicesModel.update(service_id, payload);
}

export const servicesService = {
  getAll,
  getById,
  get,
  delete: deleteService,
  create,
  update,
  assertAdminService,
}