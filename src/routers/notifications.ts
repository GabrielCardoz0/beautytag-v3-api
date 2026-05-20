import { Router } from "express";
import { authenticateToken } from "../services/middlewares/auth";
import { EnumRoles, validateRole } from "../services/middlewares/validate-role";
import { notificationsController } from "../controllers/notifications";

const notificationsRouter = Router();

notificationsRouter
  .use(authenticateToken)
  .use(validateRole([EnumRoles.admin]))
  .get("/", notificationsController.getAll)
  .patch("/:id/read", notificationsController.markAsRead)
  .patch("/read-all", notificationsController.markAllAsRead);

export { notificationsRouter };
