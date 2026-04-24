import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { IQueryPagination } from "./services";

async function get(query: IQueryPagination) {
  const page = query?.page ?? 1;
  const take = query?.size ?? 150;
  const skip = take * (page - 1);

  return prisma.forms.findMany({
    orderBy: [
      { created_at: "desc" },
    ],
    include: {
      forms_options: {
        include: {
          options: true,
          forms_options_secondary_options: {
            include: {
              options: true
            }
          },
        }
      }
    },
    skip,
    take,
  });
}

async function getById(id: number) {
  return prisma.forms.findFirst({
    include: {
      forms_options: {
        include: {
          options: true,
          forms_options_secondary_options: {
            include: {
              options: true
            }
          },
        }
      }
    },
    where: {
      id,
    },
  });
}

async function create(data: Prisma.formsCreateInput) {
  return prisma.forms.create({
    data,
    include: {
      forms_options: {
        include: {
          options: true,
          forms_options_secondary_options: {
            include: {
              options: true
            }
          }
        }
      }
    }
  });
}

async function update( id: number, data: Prisma.formsUpdateInput) {
  return prisma.forms.update({
    where: { id },
    data,
    include: {
      forms_options: {
        include: {
          options: true,
          forms_options_secondary_options: {
            include: {
              options: true
            }
          }
        }
      }
    }
  });
}

async function deleteForms(id: number) {
  return prisma.forms.delete({
    where: { id },
  });
}

async function getFormsOptionById(id: number) {
  return prisma.forms_options.findFirst({
    where: { id },
  });
}

async function getFormsSecondaryOptionById(id: number) {
  return prisma.forms_options_secondary_options.findFirst({
    where: { id },
  });
}

async function deleteFormsOptionById(id: number) {
  return prisma.forms_options.delete({
    where: { id },
  });
}

async function deleteFormsSecondaryOptionById(id: number) {
  return prisma.forms_options_secondary_options.delete({
    where: { id },
  });
}

export const formsModel = {
  get,
  getById,
  create,
  update,
  delete: deleteForms,
  getFormsOptionById,
  getFormsSecondaryOptionById,
  deleteFormsOptionById,
  deleteFormsSecondaryOptionById
};
