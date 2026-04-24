import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../services/middlewares/validate-schema";
import { EnumRoles, validateRole } from "../services/middlewares/validate-role";
import { authenticateToken } from "../services/middlewares/auth";
import { Prisma } from "../generated/prisma/client";
import { formsController } from "../controllers/forms";

const formsRouter = Router();

const CreateFormsSchema = Joi.object<Prisma.formsCreateInput>({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  forms_options: Joi.array().items(Joi.object({
    id: Joi.number().required(),
    secondary_options: Joi.array().items(Joi.object({
      id: Joi.number().required()
    })).optional()
  })).required()
});

const UpdateFormsSchema = Joi.object<Prisma.formsUpdateInput>({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  forms_options: Joi.array().items(Joi.object({
    id: Joi.number().required(),
    secondary_options: Joi.array().items(Joi.object({
      id: Joi.number().required()
    })).optional()
  })).optional()
});

formsRouter
  .get("/:id", formsController.getById)
  .use(authenticateToken)
  .post("/", validateRole([EnumRoles.admin]), validateBody(CreateFormsSchema), formsController.create)
  .get("/", validateRole([EnumRoles.admin]), formsController.get)
  .put("/:id", validateRole([EnumRoles.admin]), validateBody(UpdateFormsSchema), formsController.update)
  .delete("/:id", validateRole([EnumRoles.admin]), formsController.delete)
  .delete("/options/:id", validateRole([EnumRoles.admin]), formsController.deleteOption)
  .delete("/secondary_options/:id", validateRole([EnumRoles.admin]), formsController.deleteSecondaryOption)
;

export { formsRouter };
