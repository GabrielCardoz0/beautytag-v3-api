import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";

async function create(data: Prisma.invoicesCreateInput) {
  return prisma.invoices.create({ data });
}

async function update(
  pagarme_transaction_id: string,
  status: string,
  payment_date: Date
) {
  return prisma.invoices.updateMany({
    where: {
      pagarme_transaction_id
    },
    data: {
      status,
      payment_date
    },
  });
}

export const invoicesService = {
  create,
  update,
};
