import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";


async function getByChatId(id: string) {
  return prisma.chat_histories.findMany({
    where: { chat_id: id },
    orderBy: {
      created_at: "asc"
    }
  });
}

async function create(data: Prisma.chat_historiesCreateInput) {
  return prisma.chat_histories.create({
    data
  });
}

export const chatHistoriesModel = {
  getByChatId,
  create
};
