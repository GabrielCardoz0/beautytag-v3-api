import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { plansModel } from "../models/plans";
import { IQueryPagination } from "../models/services";
import { usersModel } from "../models/users";
import { ICreatePlan } from "../routers/plans";
import { authService } from "./auth";
import { evolutionApiService } from "./evolution/service";
import { invoicesService } from "./invoices";
import { EnumRoles } from "./middlewares/validate-role";
import { notificationsService, EnumNotificationType } from "./notifications";
import { pagarmeApi } from "./pagarme/api";
import { servicesService } from "./services";
import { usersService } from "./users";

export enum EnumPlanStatus {
  ativo = "Ativo",
  aguardandoPgto = "Aguardando Pagamento",
  desativado = "Desativado",
}

async function getById(id: number) {
  const plan = await plansModel.getById(Number(id));

  if (!plan) throw new Error("Não foi possível encontrar o plano solicitado.");

  return plan;
}

async function get(query?: IQueryPagination) {
  return plansModel.get(query);
}

async function deletePlan(plan_id: number) {
  const plan = await getById(plan_id);
  plansModel.delete(plan_id);
  await usersService.delete(plan.user_id)

}

async function create(payload: ICreatePlan) {

  const createdPlan = await plansModel.create({
    status: EnumPlanStatus.aguardandoPgto,
    users: {
      create: {
        email: payload.email,
        name: payload.name,
        password: authService.hashPassword(payload.metadata.cpf),
        role: EnumRoles.colaborador,
        metadata: payload.metadata
      }
    },
    plan_services: {
      createMany: {
        data: payload.plan_services.map((item) => ({
          service_id: item.id,
          frequency: item.frequency,
        })),
      },
    },
  });

  const planValue = createdPlan.plan_services.reduce((acc, item) => {
    const freq = parseInt(item.frequency);
    return acc + item.service.price * freq;
  }, 0);

  const client = { ...payload, ...payload.metadata };

  const { paymentUrl, orderId } = await pagarmeApi.createPaymentLink(planValue, client, createdPlan.plan_services);

  await invoicesService.create({
    user: {
      connect: {
        id: createdPlan.user_id
      }
    },
    amount: planValue,
    status: "pendente",
    pagarme_transaction_id: orderId
  });

  await evolutionApiService.sendMessage({
    number: payload.metadata.whatsapp,
    text: `Olá ${payload.name}, seja bem vindo(a) a Beauty Tag! Para continuar com a compra, faça o pagamento através do link: ${paymentUrl}`
  });

  notificationsService.create({
    title: "Novo colaborador cadastrado",
    body: `${payload.name} (${payload.email}) foi cadastrado como colaborador e aguarda pagamento do plano.`,
    type: EnumNotificationType.info,
    user_id: createdPlan.user_id,
  }).catch(() => {});
}

async function update(plan_id: number, payload: Prisma.plansUpdateInput) {
  await getById(plan_id);

  return await plansModel.update(plan_id, payload);
}

async function addService(plan_id: number, payload: { service_id: number, frequency: string }) {
  const plan = await getById(plan_id);

  await servicesService.getById(payload.service_id);

  if (plan!.plan_services!.find(i => i.plan_id === payload.service_id)) {
    throw new Error("Este plano já contém este serviço.");
  }

  return await plansModel.update(plan_id, {
    plan_services: {
      create: {
        frequency: payload.frequency,
        service_id: payload.service_id
      }
    }
  });
}

async function removeService(plan_id: number, plan_service_id: number) {
  const plan = await getById(plan_id);

  const relation = plan.plan_services.find(
    (i) => i.id === plan_service_id
  );

  if (!relation) {
    throw new Error("Este plano não contém este serviço.");
  }

  return await plansModel.update(plan_id,{
      plan_services: {
        delete: {
          id: relation.id
        }
      }
  });
}

async function getByUserId(id: number) {
  return prisma.plans.findFirst({
    where: {
      user_id: id
    },
    include: {
      plan_services: {
        include: {
          service: true
        }
      }
    }
  })
}

async function chargeAguardandoPgto() {
  const plans = await prisma.plans.findMany({
    where: { status: EnumPlanStatus.aguardandoPgto },
    include: {
      users: true,
      plan_services: {
        include: {
          service: {
            include: { user: true }
          }
        }
      }
    }
  });

  for (const plan of plans) {
    try {
      const metadata = plan.users.metadata as { cpf?: string; whatsapp?: string } | null;

      if (!metadata?.whatsapp) continue;

      const invoice = await prisma.invoices.findFirst({
        where: { user_id: plan.user_id, status: "pendente" },
        orderBy: { created_at: "desc" },
      });

      if (!invoice?.pagarme_transaction_id) continue;

      let paymentUrl = await pagarmeApi.getPaymentUrl(invoice.pagarme_transaction_id);

      if (!paymentUrl) {
        if (!metadata?.cpf) continue;

        const planValue = plan.plan_services.reduce((acc, item) => {
          return acc + item.service.price * parseInt(item.frequency);
        }, 0);

        const client = {
          name: plan.users.name,
          email: plan.users.email,
          cpf: metadata.cpf,
          whatsapp: metadata.whatsapp,
        };

        const result = await pagarmeApi.createPaymentLink(planValue, client, plan.plan_services);
        paymentUrl = result.paymentUrl;

        await prisma.invoices.update({
          where: { id: invoice.id },
          data: { pagarme_transaction_id: result.orderId },
        });
      }

      await evolutionApiService.sendMessage({
        number: metadata.whatsapp,
        text: `Olá ${plan.users.name}, seu pagamento ainda está pendente. Acesse o link para regularizar: ${paymentUrl}`
      });
    } catch (error) {
      console.error(`Erro ao cobrar plano ${plan.id}:`, error);
    }
  }
}

export const plansService = {
  getById,
  get,
  delete: deletePlan,
  create,
  update,
  addService,
  removeService,
  getByUserId,
  chargeAguardandoPgto,
};
