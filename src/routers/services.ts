import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../services/middlewares/validate-schema";
import { EnumRoles, validateRole } from "../services/middlewares/validate-role";
import { authenticateToken } from "../services/middlewares/auth";
import { Prisma } from "../generated/prisma/client";
import { servicesController } from "../controllers/services";

const servicesRouter = Router();

const ServiceCreateSchema = Joi.object<Partial<Prisma.servicesCreateInput> & { user_id: number }>({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required(),
  genre: Joi.string().required(),
  spent_time: Joi.number().required(),

  percent_colab: Joi.number().optional(),
  percent_repasse: Joi.number().optional(),
  preco_parceiro: Joi.number().optional(),
  preco_colab: Joi.number().optional(),
  lucro: Joi.number().optional(),
  user_id: Joi.number().optional(),
});

const ServiceUpdateSchema = Joi.object<Prisma.servicesUpdateInput>({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().optional(),
  genre: Joi.string().optional(),
  spent_time: Joi.number().optional(),
  is_complete: Joi.boolean().optional(),
  is_active: Joi.boolean().optional(),

  percent_colab: Joi.number().optional(),
  percent_repasse: Joi.number().optional(),
  preco_parceiro: Joi.number().optional(),
  preco_colab: Joi.number().optional(),
  lucro: Joi.number().optional(),
});

servicesRouter
  .use(authenticateToken)
  .get("/users/:id", validateRole([EnumRoles.admin]), servicesController.get)
  .get("/all", validateRole([EnumRoles.admin]), servicesController.getAll)
  .get("/", validateRole([EnumRoles.admin, EnumRoles.parceiro]), servicesController.get)
  .get("/:id", validateRole([EnumRoles.admin, EnumRoles.parceiro]), servicesController.getById)
  .post("/", validateRole([EnumRoles.admin, EnumRoles.parceiro]), validateBody(ServiceCreateSchema), servicesController.create)
  .put("/:id", validateRole([EnumRoles.admin, EnumRoles.parceiro]), validateBody(ServiceUpdateSchema), servicesController.update)
  .delete("/:id", validateRole([EnumRoles.admin, EnumRoles.parceiro]), servicesController.delete);

export { servicesRouter };
