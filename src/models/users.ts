import { prisma } from "../config/prisma";
import { buildPhoneVariants } from "../config/utils";
import { Prisma } from "../generated/prisma/client";
import { EnumRoles } from "../services/middlewares/validate-role";
import { IQueryPagination } from "./services";

async function getByEmail(email: string) {
  return prisma.users.findFirst({
    where: {
      email,
    },
  });
}

async function getById(id: number) {
  return prisma.users.findFirst({
    include: {
      plans: {
        include: {
          plan_services: true
        }
      },
      services: true,
    },
    where: {
      id,
    },
  });
}


async function getByWhatsapp(whatsapp: string) {
  const variants = buildPhoneVariants(whatsapp);

  const user = await prisma.users.findFirst({
    orderBy: {
      id: "desc",
    },
    include: {
      plans: {
        include: {
          plan_services: {
            include: {
              service: {
                include: {
                  user: true
                }
              }
            }
          },
        },
      },
    },
    where: {
      role: EnumRoles.colaborador,
      OR: variants.map((variant) => ({
        metadata: {
          path: ["whatsapp"],
          equals: variant,
        },
      })),
    },
  });

  // Alias: remapeia `users` para `prestador` dentro de cada service
  const result = {
    ...user,
    plans: user?.plans?.map((plan) => ({
      ...plan,
      plan_services: plan.plan_services.map((ps) => ({
        ...ps,
        service: ps.service
          ? (() => {
              const { user, ...rest } = ps.service;
              return { ...rest, prestador: user };
            })()
          : ps.service,
      })),
    })),
  };

  return result;
}


async function create(data: Prisma.usersCreateInput) {
  return prisma.users.create({
    data,
    include: {
      plans: {
        include: {
          plan_services: true
        }
      },
      services: true,
    }
  });
}

async function update({ id, data }: { id: number; data: Prisma.usersUpdateInput; }) {
  return prisma.users.update({
    where: { id },
    data,
    include: {
      plans: {
        include: {
          plan_services: true
        }
      },
      services: true,
    }
  });
}

async function deleteUser(id: number) {
  return prisma.users.delete({
    where: { id },
  });
}

async function getAll(query?: IQueryPagination) {
  const page = query?.page ?? 1;
  const take = query?.size ?? 150;
  const skip = take * (page - 1);

  return prisma.users.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      services: true
    },
    skip,
    take,
    where: {
      role: {
        equals: EnumRoles.parceiro
      },
      OR: [
        { name: { contains: query?.search } },
        { email: { contains: query?.search } },
      ]
    }
  });
}

async function getByServiceId(id: number) {
  return prisma.users.findFirst({
    where: {
      services: {
        some: {
          id
        }
      }
    }
  });
}

export const usersModel = {
  getByEmail,
  getById,
  create,
  update,
  delete: deleteUser,
  getAll,
  getByWhatsapp,
  getByServiceId
};
