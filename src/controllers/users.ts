import { NextFunction, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { authService } from "../services/auth";
import { AuthenticatedRequest } from "../services/middlewares/auth";
import { usersService } from "../services/users";

async function getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const users = await usersService.getAll({
      page: Number(req.query.page) || 1,
      size: Number(req.query.size) || 10,
      search: String(req.query.search || ""),
    });

    return res.send({ users });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getMe(req.user!.id);

    return res.send({ user });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getById(Number(req.params.id));

    return res.send({ user });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function getClientByPhone(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const phone = req.query.phone as string | undefined;

    if (!phone) return res.status(400).send({ message: "O parâmetro 'phone' é obrigatório." });

    const client = await usersService.getClientNameByPhone(phone);

    return res.send({ client });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.create(req.body);

    return res.send({ user });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.delete(Number(req.params.id));

    return res.send({ message: "Usuário deletado com sucesso!" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.update(Number(req.params.id), req.body);

    return res.send(user);
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

export const usersController = {
  getAll,
  getMe,
  getById,
  getClientByPhone,
  create,
  delete: deleteUser,
  update,
}