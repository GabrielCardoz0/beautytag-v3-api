import { Response } from "express";
import { AuthenticatedRequest } from "../services/middlewares/auth";

export const errorHandler = (error: any, req: AuthenticatedRequest, res: Response) => {
  console.error(`Error processing request ${req.originalUrl}:`, JSON.stringify(error?.response?.data ?? error, null, 2));
  return res.status(error.status ?? 500).send({ message: error.message ?? "Erro ao processar requisição "+req.originalUrl });
}