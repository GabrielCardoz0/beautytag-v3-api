import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { usersModel } from "../../models/users";

dotenv.config();

export type AuthenticatedRequest = Request & { user?: { id: number, name: string, password: string, role: string } };

export type JWTPayload = {
  userId: number;
};

export async function authenticateToken( req: AuthenticatedRequest, res: Response, next: NextFunction ): Promise<any> {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) return res.status(401).send({
      name: "UnauthorizedError",
      message: "Você precisa estar logado para continuar.",
    });
    
    const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    const findedUser = await usersModel.getById(userId);

    if (!findedUser) return res.status(401).send({
      name: "UnauthorizedError",
      message: "Você precisa estar logado para continuar.",
    });
    
    req.user = findedUser;

    return next();
    
  } catch (error) {
    return res.status(401).send({
      name: "UnauthorizedError",
      message: "Você precisa estar logado para continuar.",
    });
  }
}