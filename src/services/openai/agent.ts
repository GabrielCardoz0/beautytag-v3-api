import OpenAI from "openai";
import dotenv from "dotenv";
import { toolHandlers, tools } from "./tools";
import { botService } from "../bot";
import { usersService } from "../users";
import { chatHistoriesModel } from "../../models/chat_histories";
import { appointmentsModel } from "../../models/appointments";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

type ParsedChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const executeToolCall = async (toolCall: ToolCall): Promise<string> => {
  const args = JSON.parse(toolCall.function.arguments);
  const handler = toolHandlers[toolCall.function.name];

  console.log(`[BOT][TOOL_CALL] name=${toolCall.function.name} args=${JSON.stringify(args)}`);

  try {
    const result = handler
      ? await handler(args)
      : { error: `Função não implementada: ${toolCall.function.name}` };

    console.log(`[BOT][TOOL_RESULT] name=${toolCall.function.name} result=${JSON.stringify(result)}`);

    return JSON.stringify(result);
  } catch (err) {
    console.log(`[BOT][TOOL_ERROR] name=${toolCall.function.name} erro=${err}`);
    return JSON.stringify({ error: "Ocorreu um erro ao executar esta ação. Informe o usuário que houve uma falha e peça para tentar novamente." });
  }
};

const formatChatHistory = (
  rawHistory: Awaited<ReturnType<typeof chatHistoriesModel.getByChatId>>
): ParsedChatMessage[] => {
  return rawHistory.map((entry) => {
    if (entry.role === "assistant" && entry.tool_calls) {
      return {
        role: "assistant" as const,
        content: entry.content ?? null,
        tool_calls: JSON.parse(entry.tool_calls as string),
      };
    }

    if (entry.role === "tool") {
      return {
        role: "tool" as const,
        content: entry.content ?? "",
        tool_call_id: entry.tool_call_id ?? "missing-tool-call-id",
      };
    }

    return {
      role: entry.role as "user" | "assistant" | "system",
      content: entry.content ?? "",
    };
  });
};

const fetchUserContext = async (phoneNumber: string): Promise<UserContext> => {
  const user = await usersService.getByWhatsapp(phoneNumber);

  if (!user) {
    return { phone: phoneNumber, isKnownClient: false };
  }

  const [upcomingAppointments, pastAppointmentsCount] = await Promise.all([
    appointmentsModel.getUpcomingByClientPhone(phoneNumber),
    appointmentsModel.countPastByClientPhone(phoneNumber),
  ]);

  return {
    phone: phoneNumber,
    isKnownClient: true,
    name: user.name,
    upcomingAppointments: upcomingAppointments?.map((a) => ({
      startAt: a.start_at,
      serviceName: a.appointments_services?.[0]?.services?.name ?? "Serviço",
      status: a.status,
    })),
    pastAppointmentsCount,
  };
};

interface UserContext {
  name?: string;
  phone: string;
  isKnownClient: boolean;
  upcomingAppointments?: Array<{
    startAt: Date;
    serviceName: string;
    status: string;
  }>;
  pastAppointmentsCount?: number;
}

const buildSystemPrompt = (
  bot: Awaited<ReturnType<typeof botService.get>>,
  userContext?: UserContext
): string => {
  if (!bot) return "";

  const now = new Date();
  const currentDatetime = now.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const currentIso = now.toISOString();

  const lines = [
    `Data e hora atual: [${currentDatetime}] (ISO 8601: ${currentIso}) — use SEMPRE esta data como referência para qualquer agendamento. NUNCA use datas do passado.`,
    `Nome: [${bot.name}]`,
    `Comportamento: [${bot.behavior}]`,
    `Descrição da empresa: [${bot.company_description}]`,
    `Regra de agendamento: o campo monthly_limit nos serviços do plano indica quantas vezes por mês o cliente pode agendar aquele serviço. Se o cliente quiser agendar múltiplos horários para o mesmo serviço e o total não ultrapassar o monthly_limit do mês corrente, AGENDE TODOS. Só recuse se o total de agendamentos já existentes no mês mais os novos solicitados ultrapassar o monthly_limit.`,
  ];

  if (userContext) {
    lines.push(`\n--- Contexto do cliente atual ---`);
    lines.push(`Telefone: [${userContext.phone}]`);

    if (userContext.isKnownClient && userContext.name) {
      lines.push(`Nome do cliente: [${userContext.name}]`);
      lines.push(`Total de agendamentos anteriores: [${userContext.pastAppointmentsCount ?? 0}]`);

      if (userContext.upcomingAppointments?.length) {
        const list = userContext.upcomingAppointments
          .map((a) => `  - ${a.serviceName} em ${a.startAt.toLocaleString("pt-BR")} (${a.status})`)
          .join("\n");
        lines.push(`Próximos agendamentos:\n${list}`);
      } else {
        lines.push(`Próximos agendamentos: [nenhum]`);
      }
    } else {
      lines.push(`Cliente: [novo, sem histórico]`);
    }
  }

  return lines.join(";\n");
};

// ─── Persistence ──────────────────────────────────────────────────────────────

const saveAssistantReply = async (chatId: string, content: string | null) => {
  await chatHistoriesModel.create({
    chat_id: chatId,
    role: "assistant",
    content: content ?? "",
    is_from_human: false,
  });
};

const saveToolRound = async (
  chatId: string,
  assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessage,
  toolResultMessages: ParsedChatMessage[]
) => {
  await chatHistoriesModel.create({
    chat_id: chatId,
    role: "assistant",
    content: assistantMessage.content ?? "",
    is_from_human: false,
    tool_calls: JSON.stringify(assistantMessage.tool_calls),
  });

  for (const tr of toolResultMessages) {
    if (tr.role !== "tool") continue;
    await chatHistoriesModel.create({
      chat_id: chatId,
      role: "tool",
      content: typeof tr.content === "string" ? tr.content : "",
      tool_call_id: tr.tool_call_id ?? null,
      is_from_human: false,
    });
  }
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const MAX_TOOL_ITERATIONS = 5;
const toolDefs = tools.map((t) => ({ type: "function" as const, function: t.function }));

export const getAgentResponse = async (
  chatId: string,
  userMessage: string,
  phoneNumber: string
): Promise<string | null> => {

  const bot = await botService.get();
  if (!bot) return null;

  const [userContext, rawHistory] = await Promise.all([
    fetchUserContext(phoneNumber),
    chatHistoriesModel.getByChatId(chatId),
  ]);

  // Salva mensagem do usuário APÓS buscar o histórico (evita duplicata na chamada à OpenAI)
  await chatHistoriesModel.create({
    chat_id: chatId,
    role: "user",
    content: userMessage,
    is_from_human: true,
  });

  const systemPrompt = buildSystemPrompt(bot, userContext);

  const messages: ParsedChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...formatChatHistory(rawHistory),
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolDefs,
    });

    const assistantMessage = response.choices[0].message;

    // Sem tool calls — resposta final
    if (!assistantMessage.tool_calls?.length) {
      await saveAssistantReply(chatId, assistantMessage.content);
      return assistantMessage.content;
    }

    // Executa todas as tool calls desta rodada
    const toolResultMessages: ParsedChatMessage[] = await Promise.all(
      assistantMessage.tool_calls.map(async (toolCall) => ({
        role: "tool" as const,
        tool_call_id: toolCall.id,
        content: await executeToolCall(toolCall as ToolCall),
      }))
    );

    // Persiste rodada e adiciona ao contexto para próxima iteração
    await saveToolRound(chatId, assistantMessage, toolResultMessages);
    messages.push(assistantMessage, ...toolResultMessages);
  }

  return "Não consegui concluir sua solicitação no momento. Por favor, tente novamente.";
};
