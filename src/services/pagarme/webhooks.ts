import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { invoicesService } from "../invoices";
import { usersService } from "../users";

import fs from "fs";

async function pagarmeWebhook(req: Request, res: Response) {
  console.log('CHEGOU REQUEST');

  fs.writeFileSync("pagarme_webhook_log.json", JSON.stringify(req.body, null, 2));
  try {
    const { event, transaction } = req.body;

    if (event !== "transaction_status_changed") {
      return res.status(400).send({ message: "Evento inválido" });
    }

    const { id: transactionId, status, paid_at } = transaction;

    if (status === "paid") {
      // Atualizar status da invoice
      await invoicesService.update(transactionId, "pago", new Date(paid_at));

      // Atualizar status do colaborador
      const invoice = await prisma.invoices.findFirst({
        where: {
          pagarme_transaction_id: transactionId,
        },
      });

      if (invoice) {
        const user = await usersService.getById(invoice!.user_id);

        await prisma.users.update({
          where: {
            id: user!.id,
          },
          data: {
            confirmed: true
          },
        });
      }
    }

    return res.send({ message: "Webhook processado com sucesso" });
  } catch (error) {
    return res.status(500).send({ message: "Erro ao processar webhook pagarme" });
  }
}

export const pagarmeWebhooks = {
  pagarmeWebhook,
};