import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";

async function get() {
  return prisma.bot.findFirst({});
}

async function create(data: Prisma.botCreateInput) {
  return prisma.bot.create({
    data
  });
}

async function update( id: number, data: Prisma.botUpdateInput) {
  return prisma.bot.update({
    where: { id },
    data,
  });
}

export const botModel = {
  get,
  create,
  update
};
