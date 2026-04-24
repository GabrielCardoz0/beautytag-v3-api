import { Prisma } from "../generated/prisma/client";
import { formsModel } from "../models/forms";
import { IQueryPagination } from "../models/services";
import { EnumRoles } from "./middlewares/validate-role";

async function getById(id: number) {
  const forms = await formsModel.getById(Number(id));

  if(!forms) throw new Error("Não foi possível encontrar o formulário solicitado.");

  return forms;
}

async function get(query: IQueryPagination) {
  return formsModel.get(query);
}

async function deleteForms(id: number) {
  await getById(id);

  return await formsModel.delete(id);
}

async function create(payload: { name: string; description?: string; forms_options: { id: number; secondary_options?: { id: number }[] }[] }) {
  const data: Prisma.formsCreateInput = {
    name: payload.name,
    description: payload.description,

    forms_options: {
      create: payload.forms_options.map(option => ({
        options: {
          connect: { id: option.id }
        },
        forms_options_secondary_options: option.secondary_options
          ? {
              create: option.secondary_options.map(sec => ({
                options: {
                  connect: { id: sec.id }
                }
              }))
            }
          : undefined
      }))
    }
  }

  return formsModel.create(data)
}


async function update(forms_id: number, payload: { name: string; description?: string; forms_options?: { id: number; secondary_options?: { id: number }[] }[] }) {
  await getById(forms_id);

  const data: Prisma.formsUpdateInput = {
    name: payload.name,
    description: payload.description,
  }

  return await formsModel.update(forms_id, data);
}

async function deleteOption(id: number) {

  const option = await formsModel.getFormsOptionById(id);

  if(!option) throw new Error("Não foi possível encontrar a opção solicitada.")

  return await formsModel.deleteFormsOptionById(id);
}

async function deleteSecondaryOption(id: number) {

  const secondaryOption = await formsModel.getFormsSecondaryOptionById(id);

  if(!secondaryOption) throw new Error("Não foi possível encontrar a opção solicitada.")

  return await formsModel.deleteFormsSecondaryOptionById(id);
}

export const formsService = {
  getById,
  get,
  delete: deleteForms,
  create,
  update,
  deleteOption,
  deleteSecondaryOption
}