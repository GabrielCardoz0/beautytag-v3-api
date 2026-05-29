import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../services/middlewares/validate-schema";
import { EnumRoles, validateRole } from "../services/middlewares/validate-role";
import { authenticateToken } from "../services/middlewares/auth";
import { plansController } from "../controllers/plans";

const plansRouter = Router();

export interface ICreatePlan {
  name: string,
  email: string,
  
  metadata: {
    cpf: string,
    empresa: string,
    birthday: Date,
    genre: string,
    whatsapp: string,
    cep: string,
  },
  
  plan_services: {
    id: number,
    frequency: string
  }[]
}

const PlanSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().required(),
  
  metadata: Joi.object({
    cpf: Joi.string().required(),
    empresa: Joi.string().required(),
    birthday: Joi.date().required(),
    genre: Joi.string().required(),
    whatsapp: Joi.string().required(),
    cep: Joi.string().required(),
  }),
  
  plan_services: Joi.array().items(Joi.object({
    id: Joi.number().required(),
    frequency: Joi.string().required()
  }))
});

const AddServicePlanSchema = Joi.object({
  service_id: Joi.number().required(),
  frequency: Joi.string().required()
});

plansRouter
  .post("/", validateBody(PlanSchema), plansController.create)
  .use(authenticateToken)
  .get("/", validateRole([EnumRoles.admin]), plansController.get)
  .get("/:id", validateRole([EnumRoles.admin]), plansController.getById)
  .post("/:id", validateRole([EnumRoles.admin]), validateBody(AddServicePlanSchema), plansController.addService)
  .delete("/:id/:planServiceId", validateRole([EnumRoles.admin]), plansController.removeService)
  .delete("/:id", validateRole([EnumRoles.admin]), plansController.delete)

export { plansRouter };
