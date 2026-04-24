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

async function create(user: { id: number, role: string }, payload: Prisma.servicesCreateInput & { user_id?: number }) {

  const userId = payload.user_id ?? user.id;

  delete payload.user_id;

  const data: Prisma.servicesCreateInput = {
    ...payload,
    user: {
      connect: {
        id: userId
      }
    }
  }

  data.is_complete = user.role === EnumRoles.admin

  if(user.role !== EnumRoles.admin) {
    data.percent_colab = 0
    data.percent_repasse = 0
    data.preco_parceiro = 0
    data.preco_colab = 0
    data.lucro = 0
  }

  return servicesModel.create(data);
}

async function update(user: { role: string, id: number }, service_id: number, payload: Prisma.servicesUpdateInput) {
  const service = await getById(service_id);
  
  if(user.role === EnumRoles.admin) {
    return servicesModel.update(service_id, payload);
  }

  payload.is_complete = service.is_complete;

  if(service.user_id !== user.id) throw new Error("Você não ter permissão para alterar este serviço.");

  return await servicesModel.update(service_id, payload);
}

export const servicesService = {
  getAll,
  getById,
  get,
  delete: deleteService,
  create,
  update
}