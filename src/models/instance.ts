import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { IQueryPagination } from "./services";

async function get() {
  return prisma.instance.findFirst({});
}

async function create(data: Prisma.instanceCreateInput) {
  return prisma.instance.create({
    data,
  });
}

async function update( id: number, data: Prisma.instanceUpdateInput) {
  return prisma.instance.update({
    where: { id },
    data,
  });
}

async function deleteInstance() {
  return prisma.instance.deleteMany({
  });
}

export const instanceModel = {
  get,
  create,
  update,
  delete: deleteInstance,
};
