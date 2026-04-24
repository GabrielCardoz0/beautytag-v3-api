import { botModel } from "../models/bot";

async function get() {
  return await botModel.get();
}

async function update(params: {
  is_active?: boolean
  is_connected?: boolean
  welcome_msg?: string
  out_of_turn_msg?: string
  response_time?: number
  start_time?: number
  end_time?: number
}) {
  const bot = await botModel.get();

  return botModel.update(bot!.id, params);
}

async function createBot() {
  const bot = await botModel.get();
  if(!bot) {
    console.log('criando bot...');
    await botModel.create({
      is_active: false,
      welcome_msg: "Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo?",
      out_of_turn_msg: "Nosso horário de atendimento é das 08:00 às 18:00. Deixe sua mensagem que responderemos assim que possível.",
      response_time: 5,
      is_connected: false,
      start_time: 480,
      end_time: 1080,
      name: "Atendente Virtual",
      behavior: "Você é um atendente virtual para uma empresa que oference planos de serviço de beleza chamada BEAUTY TAG. Seu objetivo é ajudar os clientes tirar dúvidas, responder perguntas e fornecer informações sobre a empresa. Seja educado, prestativo e eficiente em suas respostas.",
      company_description: "A BEAUTY TAG é uma empresa especializada em oferecer planos de serviço de beleza personalizados para seus clientes. Com uma equipe de profissionais altamente qualificados, a BEAUTY TAG oferece uma ampla gama de serviços, incluindo cuidados com a pele, cabelo, unhas e maquiagem. A empresa se destaca por sua abordagem inovadora e centrada no cliente, proporcionando uma experiência única e satisfatória para cada pessoa que busca seus serviços."
    });
    console.log('bot criado');
  }
}

export const botService = {
  update,
  createBot,
  get,
}