import { NextFunction, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { AuthenticatedRequest } from "../services/middlewares/auth";
import { formsService } from "../services/forms";


async function get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const forms = await formsService.get(req.query as any);

    return res.send({ forms });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const forms = await formsService.getById(Number(req.params.id));

    return res.send({ forms });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const forms = await formsService.create(req.body);

    return res.send({ forms });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const forms = await formsService.update(Number(req.params!.id), req.body);

    return res.send({ forms });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function deleteForms(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await formsService.delete(Number(req.params.id));

    return res.send({ message: "Formulário deletado com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function deleteOption(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await formsService.deleteOption(Number(req.params.id));

    return res.send({ message: "Opção deletada com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function deleteSecondaryOption(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await formsService.deleteSecondaryOption(Number(req.params.id));

    return res.send({ message: "Opção secundário deletada com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

export const formsController = {
  get,
  getById,
  create,
  update,
  delete: deleteForms,
  deleteOption,
  deleteSecondaryOption,
}