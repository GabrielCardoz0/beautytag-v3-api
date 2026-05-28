import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../services/middlewares/validate-schema";
import { EnumRoles, validateRole } from "../services/middlewares/validate-role";
import { authenticateToken } from "../services/middlewares/auth";
import { Prisma } from "../generated/prisma/client";
import { appointmentsController } from "../controllers/appointments";

const appointmentsRouter = Router();

export interface ICreateAppointment {
  service_id: number;
  client_name: string;
  client_phone: string;
  start_at: Date;
  end_at: Date;
  notes: string;
}

const AppointmentsSchema = Joi.object<ICreateAppointment>({
  client_name: Joi.string().required(),
  client_phone: Joi.string().required(),
  start_at: Joi.date().required(),
  end_at: Joi.date().required(),
  notes: Joi.string().optional(),
  service_id: Joi.number().required(),
});

appointmentsRouter
  .use(authenticateToken)
  .get("/", validateRole([EnumRoles.admin, EnumRoles.parceiro]), appointmentsController.get)
  .post("/", validateRole([EnumRoles.admin, EnumRoles.parceiro, EnumRoles.bot]), validateBody(AppointmentsSchema), appointmentsController.create)
  .put("/", validateRole([EnumRoles.admin, EnumRoles.parceiro, EnumRoles.bot]), validateBody(AppointmentsSchema), appointmentsController.update)
  .delete("/:id", validateRole([EnumRoles.admin, EnumRoles.parceiro, EnumRoles.bot]), appointmentsController.delete);

export { appointmentsRouter };
