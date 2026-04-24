import { prisma } from "../config/prisma";
import { Prisma } from "../generated/prisma/client";
import { plansModel } from "../models/plans";
import { IQueryPagination } from "../models/services";
import { ICreatePlan } from "../routers/plans";
import { authService } from "./auth";
import { evolutionApiService } from "./evolution/service";
import { invoicesService } from "./invoices";
import { EnumRoles } from "./middlewares/validate-role";
import { pagarmeApi } from "./pagarme/api";
import { servicesService } from "./services";

enum EnumPlanStatus {
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
  await getById(plan_id);

  return plansModel.delete(plan_id);
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

  const planValue = createdPlan.plan_services.reduce((acc, item) => acc + item.service.price, 0);

  const client = { ...payload, ...payload.metadata };

  const paymentLink = await pagarmeApi.createPaymentLink(planValue, client);

  await invoicesService.create({
    user: {
      connect: {
        id: createdPlan.user_id
      }
    },
    amount: planValue,
    status: "pendente",
    pagarme_transaction_id: ""
  });

  await evolutionApiService.sendMessage({
    number: payload.metadata.whatsapp,
    text: `Olá ${payload.name}, seja bem vindo(a) a Beauty Tag! Para continuar com a compra, faça o pagamento através do link: ${paymentLink}`
  });


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

export const plansService = {
  getById,
  get,
  delete: deletePlan,
  create,
  update,
  addService,
  removeService,
  getByUserId,
};
