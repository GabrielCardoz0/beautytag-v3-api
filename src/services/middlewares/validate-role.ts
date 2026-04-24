import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth";

export enum EnumRoles {
  admin = "admin",
  colaborador = "colaborador",
  parceiro = "parceiro",
  bot = "bot",
}

type ValidationMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction)=> void;

export function validateRole(roles: string[]): ValidationMiddleware {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (roles.includes(req.user!.role!)) {
      next();
    } else {
      return res.status(401).send({
        name: "UnauthorizedError",
        message: "Você não tem autorização para continuar.",
      });
    }
  };
}
