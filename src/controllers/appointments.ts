import { NextFunction, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { AuthenticatedRequest } from "../services/middlewares/auth";
import { appointmentsService } from "../services/appointments";

async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const appointments = await appointmentsService.getAll(req.query as any);

    return res.send({ appointments });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const appointments = await appointmentsService.get(req.user!.id, req.query as any);

    return res.send({ appointments });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentsService.getById(Number(req.params.id));

    return res.send({ appointment });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentsService.create(req.user!, req.body);

    return res.send({ appointment });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentsService.update(req.user!, Number(req.params!.id), req.body);

    return res.send({ appointment });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function deleteAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await appointmentsService.delete(req.user!, Number(req.params.id));

    return res.send({ message: "Reserva deletada com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getEarningsSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const earnings = await appointmentsService.getEarningsSummary(req.user!.id);

    return res.send({ earnings });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

export const appointmentsController = {
  getAll,
  get,
  getById,
  create,
  update,
  delete: deleteAppointment,
  getEarningsSummary,
}