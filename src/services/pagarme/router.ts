import { Router } from "express";
import { pagarmeWebhooks } from "./webhooks";

const pagarmeRouter = Router();

pagarmeRouter.post("/webhook", pagarmeWebhooks.pagarmeWebhook);

export { pagarmeRouter };