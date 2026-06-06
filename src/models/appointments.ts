import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { IQueryPagination } from "./services";

export interface IQueryPaginationDateRange extends IQueryPagination {
  start_at: Date,
  end_at: Date
}

export enum EnumStatus {
  cancelado = "Cancelado",
  agendado = "Agendado",
  concluido = "Concluído",
}


async function getAll(query: IQueryPaginationDateRange) {
  const page = query?.page ?? 1;
  const take = query?.size ?? 150;
  const skip = take * (page - 1);

  return prisma.appointments.findMany({
    where: {
      start_at: {
        gte: query.start_at,
        lte: query.end_at,
      },
      end_at: {
        gte: query.start_at,
        lte: query.end_at,
      },
    },
    orderBy: [
      { start_at: "asc" },
    ],
    include: {
      user: true,
      appointments_services: {
        include: {
          services: true
        }
      }
    },
    skip,
    take,
  });
}

async function get(user_id: number, query: IQueryPaginationDateRange) {
  const page = query?.page ?? 1;
  const take = query?.size ?? 150;
  const skip = take * (page - 1);

  return prisma.appointments.findMany({
    where: {
      start_at: {
        gte: query.start_at,
        lte: query.end_at,
      },
      end_at: {
        gte: query.start_at,
        lte: query.end_at,
      },
      user_id,
    },
    orderBy: [
      { start_at: "asc" },
    ],
    include: {
      user: true,
      appointments_services: {
        include: {
          services: true
        }
      }
    },
    skip,
    take,
  });
}

async function getById(id: number) {
  return prisma.appointments.findFirst({
    include: {
      user: true,
      appointments_services: {
        include: {
          services: true
        }
      },
    },
    where: {
      id,
    },
  });
}

async function create(data: Prisma.appointmentsCreateInput) {
  return prisma.appointments.create({
    data,
  });
}

async function update( id: number, data: Prisma.appointmentsUpdateInput) {
  return prisma.appointments.update({
    where: { id },
    data,
  });
}

async function deleteService(id: number) {
  return prisma.appointments.delete({
    where: { id },
  });
}

async function findByUserAndInterval(userId: number, start: Date, end: Date) {
  return prisma.appointments.findMany({
    where: {
      user_id: userId,
      AND: [
        { start_at: { lt: end } },
        { end_at: { gt: start } }
      ],
      status: { not: EnumStatus.cancelado }
    }
  });
}

async function findNextAvailableSlots(userId: number, from: Date, durationMinutes: number, limit = 3) {
  // implementação simples: checar janelas a cada 30 minutos nas próximas 7 dias
  const slots: string[] = [];
  const step = 30; // minutos
  const horizon = 7; // dias
  for (let d = 0; d < horizon * 24 * 60 && slots.length < limit; d += step) {
    const candidateStart = new Date(from.getTime() + d * 60000);
    const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60000);
    const conflicts = await findByUserAndInterval(userId, candidateStart, candidateEnd);
    if (conflicts.length === 0) slots.push(candidateStart.toISOString());
  }
  return slots;
}

const getUpcomingByClientPhone = async (phone: string) => {
  return prisma.appointments.findMany({
    where: {
      client_phone: phone,
      start_at: { gte: new Date() },
      status: { not: EnumStatus.cancelado },
    },
    orderBy: { start_at: "asc" },
    take: 3,
    include: {
      appointments_services: {
        include: { services: true },
      },
    },
  });
}

const countPastByClientPhone = async (phone: string) => {
  return prisma.appointments.count({
    where: {
      client_phone: phone,
      start_at: { lt: new Date() },
    },
  });
}

const getByPartnerAndDateRange = async (partnerId: number, start: Date, end: Date) => {
  return prisma.appointments.findMany({
    where: {
      user_id: partnerId,
      AND: [
        { start_at: { lt: end } },
        { end_at: { gt: start } }
      ],
      status: { not: EnumStatus.cancelado }
    },
    include: {
      user: true,
      appointments_services: {
        include: {
          services: true
        }
      }
    },
  });
}

export const appointmentsModel = {
  get,
  getById,
  create,
  update,
  delete: deleteService,
  getAll,
  findByUserAndInterval,
  findNextAvailableSlots,
  getUpcomingByClientPhone,
  countPastByClientPhone,
  getByPartnerAndDateRange
};
