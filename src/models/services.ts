import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";

export interface IQueryPagination { page?: number; size?: number; search?: string };

async function getAll(query?: IQueryPagination) {
  const page = query?.page ?? 1;
  const take = query?.size ?? 150;
  const skip = take * (page - 1);

  return prisma.services.findMany({
    orderBy: [
      { user_id: "asc" },
      { name: "asc" }
    ],
    include: {
      user: true,
    },
    skip,
    take,
  });
}

async function get(user_id: number, query?: IQueryPagination) {
  const page = query?.page ?? 1;
  const take = query?.size ?? 150;
  const skip = take * (page - 1);
  return prisma.services.findMany({
    orderBy: {
      id: "desc"
    },
    skip,
    take,
    where: {
      user_id
    }
  });
}

async function getById(id: number) {
  return prisma.services.findFirst({
    include: {
      appointments_services: true,
    },
    where: {
      id,
    },
  });
}

async function create(data: Prisma.servicesCreateInput) {
  return prisma.services.create({
    data,
  });
}

async function update( id: number, data: Prisma.servicesUpdateInput) {
  return prisma.services.update({
    where: { id },
    data,
  });
}

async function deleteService(id: number) {
  return prisma.services.delete({
    where: { id },
  });
}

export const servicesModel = {
  get,
  getById,
  create,
  update,
  delete: deleteService,
  getAll
};
