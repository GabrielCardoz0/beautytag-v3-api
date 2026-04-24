import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../services/middlewares/validate-schema";
import { botController } from "../controllers/bot";
import { authenticateToken } from "../services/middlewares/auth";
import { EnumRoles, validateRole } from "../services/middlewares/validate-role";

const botRouter = Router();

const UpdateBotSchema = Joi.object({
  is_active: Joi.boolean().optional(),
  welcome_msg: Joi.string().optional(),
  out_of_turn_msg: Joi.string().optional(),
  response_time: Joi.number().optional(),
  start_time: Joi.number().optional(),
  end_time: Joi.number().optional(),
  behavior: Joi.string().optional(),
  name: Joi.string().optional(),
  company_description: Joi.string().optional(),
});

botRouter
  .get("/", botController.get)
  .use(authenticateToken)
  .put("/", validateRole([EnumRoles.admin]), validateBody(UpdateBotSchema), botController.update)
;

export { botRouter };