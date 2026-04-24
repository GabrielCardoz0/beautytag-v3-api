import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../services/middlewares/validate-schema";
import { authController } from "../controllers/auth";

const authRouter = Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

authRouter
  .post("/login", validateBody(loginSchema), authController.login)
;

export { authRouter };