import OpenAI from "openai";
import dotenv from "dotenv";
import { toolHandlers, tools } from "./tools";
import { formatWhatsAppNumber } from "../../config/utils";
import { botService } from "../bot";
import { evolutionApiService } from "../evolution/service";
import { usersService } from "../users";
import { servicesService } from "../services";
import { appointmentsService } from "../appointments";
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

  const result = handler
    ? await handler(args)
    : { error: `Função não implementada: ${toolCall.function.name}` };

  return JSON.stringify(result);
};

const formatChatHistory = (
  rawHistory: Awaited<ReturnType<typeof chatHistoriesModel.getByChatId>>
): ParsedChatMessage[] => {
  return rawHistory.map((entry) => {
    // Assistant com tool_calls pendentes
    if (entry.role === "assistant" && entry.tool_calls) {
      return {
        role: "assistant" as const,
        content: entry.content ?? null,
        tool_calls: JSON.parse(entry.tool_calls as string),
      };
    }

    // Resultado de tool
    if (entry.role === "tool") {
      return {
        role: "tool" as const,
        content: entry.content ?? "",
        tool_call_id: entry.tool_call_id ?? "missing-tool-call-id",
      };
    }

    // user / assistant simples
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

  const lines = [
    `Nome: [${bot.name}]`,
    `Comportamento: [${bot.behavior}]`,
    `Descrição da empresa: [${bot.company_description}]`,
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

// ─── OpenAI Callers ───────────────────────────────────────────────────────────

const callOpenAiWithTools = (
  systemPrompt: string,
  history: ParsedChatMessage[],
  userMessage: string
) =>
  openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userMessage },
    ],
    tools: tools.map((tool) => ({ type: "function" as const, function: tool.function })),
  });

const callOpenAiAfterToolExecution = (
  systemPrompt: string,
  history: ParsedChatMessage[],
  userMessage: string,
  assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessage,
  toolResultMessages: ParsedChatMessage[]
) =>
  openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userMessage },
      assistantMessage,
      ...toolResultMessages,
    ],
  });

// ─── Persistence ──────────────────────────────────────────────────────────────

const saveAssistantReply = async (
  chatId: string,
  content: string | null
) => {
  await chatHistoriesModel.create({
    chat_id: chatId,
    role: "assistant",
    content: content ?? "",
    is_from_human: false,
  });
};

const saveToolExecutionResult = async (
  chatId: string,
  finalContent: string | null,
  assistantMessage: OpenAI.Chat.Completions.ChatCompletionMessage,
  toolResultMessages: ParsedChatMessage[]
) => {
  // 1. Salva a mensagem do assistant com tool_calls
  await chatHistoriesModel.create({
    chat_id: chatId,
    role: "assistant",
    content: assistantMessage.content ?? "",
    is_from_human: false,
    tool_calls: JSON.stringify(assistantMessage.tool_calls),
  });

  // 2. Salva cada tool result individualmente
  for (const toolResult of toolResultMessages) {
    if (toolResult.role !== "tool") continue;
    await chatHistoriesModel.create({
      chat_id: chatId,
      role: "tool",
      content: typeof toolResult.content === "string" ? toolResult.content : "",
      tool_call_id: toolResult.tool_call_id ?? null,
      is_from_human: false,
    });
  }

  // 3. Salva a resposta final do assistant após a tool
  await chatHistoriesModel.create({
    chat_id: chatId,
    role: "assistant",
    content: finalContent ?? "",
    is_from_human: false,
  });
};


export const getAgentResponse = async (
  chatId: string,
  userMessage: string,
  phoneNumber: string
): Promise<string | null> => {

  const bot = await botService.get();
  if (!bot) return null;

  // Busca histórico e contexto do usuário
  const [userContext, rawHistory] = await Promise.all([
    fetchUserContext(phoneNumber),
    chatHistoriesModel.getByChatId(chatId),
  ]);

  // ✅ Salva mensagem do usuário APÓS buscar o histórico (evita duplicata na chamada à OpenAI)
  await chatHistoriesModel.create({
    chat_id: chatId,
    role: "user",
    content: userMessage,
    is_from_human: true,
  });

  const systemPrompt = buildSystemPrompt(bot, userContext);
  const formattedHistory = formatChatHistory(rawHistory);

  const firstResponse = await callOpenAiWithTools(systemPrompt, formattedHistory, userMessage);
  const assistantMessage = firstResponse.choices[0].message;

  if (!assistantMessage.tool_calls?.length) {
    await saveAssistantReply(chatId, assistantMessage.content);
    return assistantMessage.content;
  }

  const toolResultMessages: ParsedChatMessage[] = await Promise.all(
    assistantMessage.tool_calls.map(async (toolCall) => ({
      role: "tool" as const,
      tool_call_id: toolCall.id,
      content: await executeToolCall(toolCall as ToolCall),
    }))
  );

  const postToolResponse = await callOpenAiAfterToolExecution(
    systemPrompt,
    formattedHistory,
    userMessage,
    assistantMessage,
    toolResultMessages
  );

  const finalContent = postToolResponse.choices[0].message.content;

  await saveToolExecutionResult(chatId, finalContent, assistantMessage, toolResultMessages);

  return finalContent;
};