import { prisma } from "../config/prisma";

export enum EnumNotificationType {
  info = "info",
  success = "success",
  warning = "warning",
  error = "error",
}

export interface ICreateNotification {
  title: string;
  body?: string;
  type?: EnumNotificationType;
  user_id?: number;
}

async function create(payload: ICreateNotification) {
  return prisma.notifications.create({
    data: {
      title: payload.title,
      body: payload.body,
      type: payload.type ?? EnumNotificationType.info,
      is_read: false,
      user_id: payload.user_id,
    },
  });
}

async function getAll(query: { page?: number; size?: number }) {
  const page = query.page ?? 1;
  const size = query.size ?? 20;
  const skip = (page - 1) * size;

  const [notifications, total] = await Promise.all([
    prisma.notifications.findMany({
      skip,
      take: size,
      orderBy: { created_at: "desc" },
    }),
    prisma.notifications.count(),
  ]);

  return { notifications, total, page, size };
}

async function markAsRead(id: number) {
  const notification = await prisma.notifications.findUnique({ where: { id } });

  if (!notification) throw new Error("Notificação não encontrada.");

  return prisma.notifications.update({
    where: { id },
    data: { is_read: true },
  });
}

async function markAllAsRead() {
  return prisma.notifications.updateMany({
    where: { is_read: false },
    data: { is_read: true },
  });
}

export const notificationsService = {
  create,
  getAll,
  markAsRead,
  markAllAsRead,
};
