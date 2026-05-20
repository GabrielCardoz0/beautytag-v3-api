import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { IQueryPagination } from "./services";

async function get(query?: IQueryPagination) {
  const page = query?.page ?? 1;
  const take = query?.size ?? 150;
  const skip = take * (page - 1);

  return prisma.plans.findMany({
    orderBy: {
      id: "desc",
    },
    include: {
      users: true,
      plan_services: {
        include: {
          service: true
        }
      }
    },
    skip,
    take,
  });
}

async function getById(id: number) {
  return prisma.plans.findFirst({
    include: {
      users: true,
      plan_services: {
        include: {
          service: true
        }
      },
    },
    where: {
      id,
    },
  });
}

async function create(data: Prisma.plansCreateInput) {
  return prisma.plans.create({
    data,
    include: {
      plan_services: {
        include: {
          service: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
}

async function update( id: number, data: Prisma.plansUpdateInput) {
  return prisma.plans.update({
    where: { id },
    data,
  });
}

async function deletePlan(id: number) {
  return prisma.plans.delete({
    where: { id },
  });
}

async function deletePlanService(id: number) {
  return prisma.plan_services.delete({
    where: { id },
  });
}

export const plansModel = {
  get,
  getById,
  create,
  update,
  delete: deletePlan,
  deletePlanService,
};
