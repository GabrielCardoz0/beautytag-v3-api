import { NextFunction, Request, Response } from "express";
import { errorHandler } from "../config/errorHandler";
import { authService } from "../services/auth";

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const token = await authService.login(req.body);

    return res.send({token});
  } catch (error) {
    return errorHandler(error, req, res);
  }
}


export const authController = {
  login
}