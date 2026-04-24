import { NextFunction, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { AuthenticatedRequest } from "../services/middlewares/auth";
import { botService } from "../services/bot";

async function get(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const bot = await botService.get();

    return res.send({ bot });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}

async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const bot = await botService.update(req.body);

    return res.send({ bot });
  } catch (error) {
    return errorHandler(error, req, res);
  }
}


export const botController = {
  get,
  update,
}