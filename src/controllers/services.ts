import { NextFunction, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { AuthenticatedRequest } from "../services/middlewares/auth";
import { servicesService } from "../services/services";

async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const services = await servicesService.getAll(req.query as any);

    return res.send({ services });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const services = await servicesService.get(req.user!, req.query as any);

    return res.send({ services });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const service = await servicesService.getById(Number(req.params.id));

    return res.send({ service });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const service = await servicesService.create(req.user!, req.body);

    return res.send({ service });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const service = await servicesService.update(req.user!, Number(req.params!.id), req.body);

    return res.send({ service });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function deleteService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await servicesService.delete(req.user!, Number(req.params.id));

    return res.send({ message: "Serviço deletado com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

export const servicesController = {
  getAll,
  get,
  getById,
  create,
  update,
  delete: deleteService,
}