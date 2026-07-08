
import { formatWhatsAppNumber } from "../../config/utils";
import { appointmentsModel } from "../../models/appointments";
import { usersModel } from "../../models/users";
import { appointmentsService } from "../appointments";
import { evolutionApiService } from "../evolution/service";
import { EnumRoles } from "../middlewares/validate-role";
import { plansService } from "../plans";
import { servicesService } from "../services";
import { usersService } from "../users";

export const tools = [

  {
    type: "function",
    function: {
      name: "callHuman",
      description:
        "Chama um humano para responder as mensagens caso o usuário solicite ou caso você não tenha capacidade para responder",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description:
              "Resumo da conversa tida para gerar um contexto, e melhorar o entendimento do que houve. Sempre passar o máximo de informações possíveis sobre o cliente.",
          },
        },
        required: ["text"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "getClientByWhatsapp",
      description:
        "Busca um cliente cadastrado pelo número de WhatsApp. Retorna dados do cliente incluindo plano ativo e serviços contratados. Use esta tool antes de qualquer agendamento ou consulta de plano.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: {
            type: "string",
            description:
              "Número de WhatsApp do cliente no formato E.164 (ex: 5511999999999)",
          },
        },
        required: ["whatsapp"],
      },
    },
  },

  // ─── Planos ───────────────────────────────────────────────────────────────────

  {
    type: "function",
    function: {
      name: "getClientPlan",
      description:
        "Retorna o plano ativo do cliente e os serviços incluídos. O campo monthly_limit indica quantas vezes por mês o cliente pode agendar aquele serviço. O cliente pode agendar até esse número de vezes no mês corrente.",
      parameters: {
        type: "object",
        properties: {
          user_id: {
            type: "number",
            description: "ID interno do usuário/cliente obtido via getClientByWhatsapp",
          },
        },
        required: ["user_id"],
      },
    },
  },

  // ─── Parceiros ────────────────────────────────────────────────────────────────

  {
    type: "function",
    function: {
      name: "getPartnerByServiceId",
      description:
        "Busca informações sobre o parceiro com base no serviço selecionado para agendamento. Retorna id, nome, whatsapp, instagram e mais informações. Use quando o cliente quiser agendar ou quiser conhecer melhor o parceiro/estabelecimento.",
      parameters: {
        type: "object",
        properties: {
          service_id: {
            type: "number",
            description:
              "Retorna apenas o parceiro que fornece o serviço solicitado",
          },
        },
        required: ["service_id"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "getPartnerAppointments",
      description:
        "Retorna a agenda de um parceiro em um intervalo de datas, com horários ocupados (start_at, end_at, status). Use para verificar disponibilidade antes de sugerir horários ao cliente.",
      parameters: {
        type: "object",
        properties: {
          partner_id: {
            type: "number",
            description: "id do parceiro obtido via getPartnerByServiceId ou getClientPlan",
          },
          date_from: {
            type: "string",
            description:
              "Início do intervalo de busca em ISO 8601 (ex: 2026-05-01T00:00:00Z). Padrão: hoje.",
          },
          date_to: {
            type: "string",
            description:
              "Fim do intervalo de busca em ISO 8601 (ex: 2026-05-07T23:59:59Z). Padrão: 7 dias a partir de date_from.",
          },
        },
        required: ["partner_id"],
      },
    },
  },

  // ─── Agendamentos ─────────────────────────────────────────────────────────────

  {
    type: "function",
    function: {
      name: "scheduleAppointment",
      description:
        "Agenda um serviço para um cliente. Só chame esta tool após o cliente confirmar explicitamente o serviço, o parceiro e o horário. Use getPartnerAppointments antes para confirmar disponibilidade.",
      parameters: {
        type: "object",
        properties: {
          whatsapp: {
            type: "string",
            description: "Número do cliente no formato E.164 sem '+' (ex: 5511999999999)",
          },
          name: {
            type: "string",
            description: "Nome completo do cliente para registrar no agendamento",
          },
          partner_whatsapp: {
            type: "string",
            description: "Número de WhatsApp do parceiro que irá atender",
          },
          service_id: {
            type: "number",
            description: "ID do serviço a ser agendado",
          },
          preferred_datetime: {
            type: "string",
            description:
              "Data e hora exata confirmada pelo cliente em ISO 8601 (ex: 2026-05-10T14:00:00Z)",
          },
        },
        required: ["whatsapp", "name", "partner_whatsapp", "service_id", "preferred_datetime"],
      },
    },
  },

  {
    type: "function",
    function: {
      name: "cancelAppointment",
      description:
        "Cancela um agendamento existente do cliente a partir do ID. Use quando o cliente solicitar cancelamento. Sempre confirme o nome do serviço e a data/hora com o cliente antes de chamar esta tool.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: {
            type: "number",
            description: "ID do agendamento a ser cancelado",
          },
          reason: {
            type: "string",
            description: "Motivo do cancelamento informado pelo cliente (opcional)",
          },
        },
        required: ["appointment_id"],
      },
    },
  },
];


const handleCallHuman = async (params: {
  number: string;
  text: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const managerNumber = process.env.MANAGER_WHATSAPP_NUMBER!;
    await evolutionApiService.sendMessage({
      number: managerNumber,
      text: params.text,
    });
    return { success: true, message: "Um humano foi chamado." };
  } catch {
    return { success: false, message: "Não foi possível contatar um humano." };
  }
};

const handleScheduleAppointment = async (args: {
  whatsapp: string;
  name: string;
  partner_whatsapp: string;
  service_id: number;
  preferred_datetime: string;
}) => {
  console.log(`[BOT][scheduleAppointment] args recebidos: ${JSON.stringify(args)}`);

  const clientNumber = formatWhatsAppNumber(args.whatsapp).split("@")[0];
  console.log(`[BOT][scheduleAppointment] clientNumber=${clientNumber}`);

  // Busca parceiro pelo service_id (evita depender da busca por WhatsApp com filtro de role incorreto)
  const partnerByService = await usersModel.getByServiceId(args.service_id);
  console.log(`[BOT][scheduleAppointment] partnerByService=${JSON.stringify(partnerByService)}`);

  if (!partnerByService || !partnerByService.id) {
    return { success: false, message: "Parceiro não encontrado para este serviço." };
  }
  if (!partnerByService.confirmed) {
    return { success: false, message: "Parceiro não ativo/válido para agendamentos." };
  }

  let service;
  try {
    service = await servicesService.getById(args.service_id);
    console.log(`[BOT][scheduleAppointment] service=${JSON.stringify(service)}`);
  } catch {
    return { success: false, message: "Serviço não encontrado para este parceiro." };
  }
  if (!service || service.user_id !== partnerByService.id) {
    console.log(`[BOT][scheduleAppointment] service.user_id=${service?.user_id} != partner.id=${partnerByService.id}`);
    return { success: false, message: "Serviço não pertence a este parceiro." };
  }
  if (service.created_by !== EnumRoles.admin) {
    console.log(`[BOT][scheduleAppointment] service ${service.id} created_by=${service.created_by}, bot não tem acesso a serviços de parceiro`);
    return { success: false, message: "Serviço não encontrado." };
  }

  try {
    const result = await appointmentsService.createFromBot({
      partnerId: partnerByService.id,
      clientNumber,
      clientName: args.name,
      serviceId: args.service_id,
      preferredAt: new Date(args.preferred_datetime),
      durationMinutes: service.spent_time ?? 60,
    });
    console.log(`[BOT][scheduleAppointment] resultado createFromBot: ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    console.log(`[BOT][scheduleAppointment] erro ao criar agendamento: ${err}`);
    return { success: false, message: "Erro ao criar o agendamento. Por favor, tente novamente ou entre em contato conosco." };
  }
};

const handleCancelAppointment = async (args: {
  appointment_id: number;
  reason?: string;
}): Promise<object> => {
  try {
    const appointment = await appointmentsService.getById(args.appointment_id);

    if (!appointment) {
      return { success: false, message: "Agendamento não encontrado." };
    }

    if (appointment.status === "Cancelado") {
      return { success: false, message: "Este agendamento já está cancelado." };
    }

    await appointmentsService.update(
      { role: "admin", id: 0 },
      args.appointment_id,
      { status: "Cancelado", notes: args.reason ?? "" }
    );

    return { success: true, message: "Agendamento cancelado com sucesso." };
  } catch {
    return { success: false, message: "Erro ao cancelar agendamento." };
  }
};

const getClientByWhatsapp = async (params: { whatsapp: string; }): Promise<object> => {
  try {
    const number = formatWhatsAppNumber(params.whatsapp);
    console.log(`[BOT][getClientByWhatsapp] buscando number=${number}`);
    const user = await usersService.getByWhatsapp(number);
    console.log(`[BOT][getClientByWhatsapp] resultado=${JSON.stringify(user)}`);

    if (!user) {
      return { found: false, message: "Cliente não encontrado." };
    }

    return {
      found: true,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      confirmed: user.confirmed,
      blocked: user.blocked,
      plans: user.plans?.map((plan) => ({
        plan_id: plan.id,
        status: plan.status,
        services: plan.plan_services?.map((ps) => ({
          service_id: ps.service_id,
          service_name: (ps.service as any)?.name,
          monthly_limit: parseInt(ps.frequency) || 1,
          duration_minutes: (ps.service as any)?.spent_time,
          price: (ps.service as any)?.price,
        })) ?? [],
      })) ?? [],
    };
  } catch (err) {
    console.log(`[BOT][getClientByWhatsapp] erro: ${err}`);
    return { found: false, message: "Erro ao buscar cliente." };
  }
};

const getClientPlan = async (params: { user_id: number; }): Promise<object> => {
  try {
    const plan = await plansService.getByUserId(params.user_id);

    if (!plan) {
      return { found: false, message: "Nenhum plano ativo encontrado para este cliente." };
    }

    return {
      found: true,
      plan_id: plan.id,
      status: plan.status,
      services: plan.plan_services?.map((ps) => ({
        service_id: ps.service_id,
        service_name: ps.service?.name,
        monthly_limit: parseInt(ps.frequency) || 1,
        duration_minutes: ps.service?.spent_time,
        price: ps.service?.price,
      })) ?? [],
    };
  } catch {
    return { found: false, message: "Erro ao buscar plano do cliente." };
  }
};

const getPartnerByServiceId = async (params: { service_id: number; }): Promise<object> => {
  try {
    console.log(`[BOT][getPartnerByServiceId] service_id=${params.service_id}`);
    const partner = await usersModel.getByServiceId(params.service_id);
    console.log(`[BOT][getPartnerByServiceId] resultado=${JSON.stringify(partner)}`);

    if (!partner) {
      return { found: false, message: "Nenhum parceiro disponível." };
    }

    const metadata = partner.metadata as { whatsapp?: string; instagram?: string } | null;

    return {
      found: true,
      id: partner.id,
      name: partner.name,
      whatsapp: metadata?.whatsapp ?? null,
      instagram: metadata?.instagram ?? null,
      role: partner.role,
      confirmed: partner.confirmed,
    };
  } catch (err) {
    console.log(`[BOT][getPartnerByServiceId] erro: ${err}`);
    return { found: false, message: "Erro ao buscar parceiros." };
  }
};

const getPartnerAppointments = async (params: {
  partner_id: number;
  date_from?: string;
  date_to?: string;
}): Promise<object> => {
  try {
    console.log(`[BOT][getPartnerAppointments] params=${JSON.stringify(params)}`);
    const partner = await usersService.getById(params.partner_id);

    if (!partner) {
      return { found: false, message: "Parceiro não encontrado." };
    }

    const dateFrom = params.date_from ? new Date(params.date_from) : new Date();
    const dateTo = params.date_to
      ? new Date(params.date_to)
      : new Date(dateFrom.getTime() + 7 * 24 * 60 * 60 * 1000);

    const appointments = await appointmentsModel.getByPartnerAndDateRange(
      partner.id,
      dateFrom,
      dateTo
    );

    if (!appointments?.length) {
      console.log(`[BOT][getPartnerAppointments] nenhum agendamento encontrado para partner_id=${partner.id}`);
      return {
        found: true,
        partner_id: partner.id,
        partner_name: partner.name,
        appointments: [],
        message: "Nenhum agendamento encontrado neste período.",
      };
    }

    console.log(`[BOT][getPartnerAppointments] encontrados ${appointments.length} agendamentos: ${JSON.stringify(appointments)}`);
    return {
      found: true,
      partner_id: partner.id,
      partner_name: partner.name,
      appointments,
    };
  } catch (err) {
    console.log(`[BOT][getPartnerAppointments] erro: ${err}`);
    return { found: false, message: "Erro ao buscar agendamentos do parceiro." };
  }
};


export const toolHandlers: Record<string, (args: any) => Promise<any>> = {
  scheduleAppointment: handleScheduleAppointment,
  cancelAppointment: handleCancelAppointment,
  callHuman: handleCallHuman,
  getClientByWhatsapp,
  getClientPlan,
  getPartnerByServiceId,
  getPartnerAppointments
};
