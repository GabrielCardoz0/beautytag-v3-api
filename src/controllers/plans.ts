import { NextFunction, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { AuthenticatedRequest } from "../services/middlewares/auth";
import { plansService } from "../services/plans";

async function get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const plans = await plansService.get(req.query as any);

    return res.send({ plans });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const service = await plansService.getById(Number(req.params.id));

    return res.send({ service });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const service = await plansService.create(req.body);

    return res.send({ service });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const service = await plansService.update(Number(req.params!.id), req.body);

    return res.send({ service });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function deletePlan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await plansService.delete(Number(req.params.id));

    return res.send({ message: "Plano deletado com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function addService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await plansService.addService(Number(req.params.id), req.body);

    return res.send({ message: "Serviço adicionado com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function removeService(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await plansService.removeService(Number(req.params.id), Number(req.params.planServiceId));

    return res.send({ message: "Serviço removido com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

export const plansController = {
  get,
  getById,
  create,
  update,
  delete: deletePlan,
  addService,
  removeService,
}