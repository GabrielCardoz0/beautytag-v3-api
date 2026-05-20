import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { invoicesService } from "../invoices";
import { notificationsService, EnumNotificationType } from "../notifications";
import { EnumPlanStatus } from "../plans";

async function pagarmeWebhook(req: Request, res: Response) {
  console.log("PAGARME WEBHOOK:", JSON.stringify(req.body, null, 2));

  try {
    const { type, data } = req.body;

    if (type !== "order.paid" && type !== "charge.paid") {
      return res.status(200).send({ message: "Evento ignorado" });
    }

    // Em order.paid, data é o order. Em charge.paid, data é a charge com order_id.
    const orderId: string = data.order_id ?? data.id;
    const paidAt: string = data.paid_at ?? data.last_transaction?.paid_at ?? new Date().toISOString();

    const invoice = await prisma.invoices.findFirst({
      where: { pagarme_transaction_id: orderId },
    });

    if (!invoice) {
      return res.status(200).send({ message: "Invoice não encontrada para este order" });
    }

    await invoicesService.update(orderId, "pago", new Date(paidAt));

    await prisma.plans.updateMany({
      where: { user_id: invoice.user_id },
      data: { status: EnumPlanStatus.ativo },
    });

    await prisma.users.update({
      where: { id: invoice.user_id },
      data: { confirmed: true },
    });

    const paidUser = await prisma.users.findUnique({ where: { id: invoice.user_id } });

    notificationsService.create({
      title: "Pagamento confirmado",
      body: `O pagamento de ${paidUser?.name ?? "um cliente"} foi confirmado com sucesso.`,
      type: EnumNotificationType.success,
      user_id: invoice.user_id,
    }).catch(() => {});

    return res.send({ message: "Webhook processado com sucesso" });
  } catch (error) {
    console.error("Erro ao processar webhook pagarme:", error);
    return res.status(500).send({ message: "Erro ao processar webhook pagarme" });
  }
}

export const pagarmeWebhooks = {
  pagarmeWebhook,
};
