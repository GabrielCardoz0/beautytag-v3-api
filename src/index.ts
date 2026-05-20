import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRouter } from "./routers/auth";
import { usersRouter } from "./routers/users";
import { appointmentsRouter } from "./routers/appointments";
import { servicesRouter } from "./routers/services";
import { formsRouter } from "./routers/forms";
import { plansRouter } from "./routers/plans";
import { evolutionRouter } from "./services/evolution/router";
import { botService } from "./services/bot";
import { botRouter } from "./routers/bot";
import { pagarmeRouter } from "./services/pagarme/router";
import { pagarmeApi } from "./services/pagarme/api";
import { usersService } from "./services/users";
import { prisma } from "./config/prisma";
import { startCronJobs } from "./services/cron";
import { notificationsRouter } from "./routers/notifications";

dotenv.config();

const app = express();

app
  .use(express.json())
  .use(cors())
  .get("/health", async (req, res) => {

    return res.send({
      timestap: new Date(),
      message: `Api is running! ${new Date().getTime()}`
    })
  })

  .use("/auth", authRouter)
  .use("/users", usersRouter)
  .use("/appointments", appointmentsRouter)
  .use("/services", servicesRouter)
  .use("/forms", formsRouter)
  .use("/plans", plansRouter)
  .use("/evolution", evolutionRouter)
  .use("/bot", botRouter)
  .use("/pagarme", pagarmeRouter)
  .use("/notifications", notificationsRouter)

  .use((error: any, req: any, res: any, next: any) => {
    const requestId = req.id ?? "no-request-id";

    res.status(error.status ?? 500).send({
      message: `${requestId} ${req.method} ${req.originalUrl} :: ${
        error.message ?? "Erro ao processar requisição"
      }`,
    });
  })

  .listen(process.env.PORT ?? 5000, () => {
    botService.createBot();
    usersService.createFirstAdminUser();
    startCronJobs();
    console.log(`API is running on port: ${process.env.PORT ?? 4000}`)
  });
