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

dotenv.config();

const app = express();

app
  .use(express.json())
  .use(cors())
  .get("/health", async (req, res) => {
    return res.send({ timestap: new Date(), message: `Api is running! ${new Date().getTime()}` })
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
    console.log(`API is running on port: ${process.env.PORT ?? 4000}`)
  });



/*

npm install prisma @prisma/client better-sqlite3 @prisma/adapter-better-sqlite3


npx prisma init --datasource-provider SQLite

alterar schema.prisma para:
datasource db {
  provider = "sqlite"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int     @id   @default(autoincrement())
  name      String
  email     String
}



npx prisma generate

npx prisma migrate dev

criar database.ts:

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
// import { PrismaClient } from './generated/prisma';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db"
})
const prisma = new PrismaClient({ adapter })

export default prisma;
















integrar notificações??

falta parte pagar.me (necessário webhooks)



Para retirar uma opção do formulário: delete("/forms/options/:id") (id da opção)
Para retirar uma opção secundária do formulário: delete("/forms/secondary_options/:id") (id da opção secundária)
para adicionar uma opção ou alterar nome ou descrição: put "/forms/:id"  passando: {
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  forms_options: Joi.array().items(Joi.object({
    id: Joi.number().required(),
    secondary_options: Joi.array().items(Joi.object({
      id: Joi.number().required()
    })).optional()
  })).optional()
}

*/