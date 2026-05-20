import { NextFunction, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { AuthenticatedRequest } from "../services/middlewares/auth";
import { notificationsService } from "../services/notifications";

async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.getAll({
      page: Number(req.query.page) || 1,
      size: Number(req.query.size) || 20,
    });

    return res.send(result);
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const notification = await notificationsService.markAsRead(Number(req.params.id));

    return res.send({ notification });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await notificationsService.markAllAsRead();

    return res.send({ message: "Todas as notificações foram marcadas como lidas." });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

export const notificationsController = {
  getAll,
  markAsRead,
  markAllAsRead,
};
