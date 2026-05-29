
import axios from "axios";
import dotenv from "dotenv";
import { instanceModel } from "../../models/instance";
import { formatWhatsAppNumber } from "../../config/utils";
import { botService } from "../bot";
dotenv.config();

const instanceName = 'myWhatsapp';

const { EVOLUTION_API_URL, EVOLUTION_API_TOKEN } = process.env;

const evolutionApi = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    "Content-Type": "application/json",
    apikey: EVOLUTION_API_TOKEN
  },
});

const createInstance = async (instanceName: string) => {

  const payload = {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
    //webhook: `http://localhost:4000/webhook/agents`,
    //webhook_by_events: true,
    //events: [
      //"MESSAGES_UPSERT",
    //]
  }

  const instance = await evolutionApi.post(`/instance/create`, payload);

  await evolutionApi.post(`webhook/set/${instanceName}`, {
    webhook: {
      url: `http://localhost:5000/evolution/webhooks`,
      events: [
        "CONNECTION_UPDATE",
        "LOGOUT_INSTANCE",
        "MESSAGES_UPSERT",
        "QRCODE_UPDATED",
        "REMOVE_INSTANCE",
      ],
      enabled: true,
      webhookByEvents: false,
      webhookBase64: false,
      instanceId: instance.data.instance.instanceId,
    }
  });

  return instance;
}

const getQrCode = async () => {
  const instance = await instanceModel.get();

  if (instance) {
    return instance
  } else {
      const { data } = await createInstance(instanceName);

      await instanceModel.create({
        is_connected: false,
        base64: data.qrcode.base64,
        evolution_id: instanceName
      });

      return { ...data.qrcode, is_connected: false };
  }
}

const sendMessage = async ({ text, number }: { number: string, text: string }) => {
  const formatedNumber = formatWhatsAppNumber(number);
  return evolutionApi.post(`/message/sendText/${instanceName}`, { number: formatedNumber, text });
}

const deleteInstance = async () => {
  const instance = await instanceModel.get();
  if (!instance) throw new Error('Nenhuma instância encontrada');

  await evolutionApi.delete(`/instance/delete/${instance.evolution_id}`);
  await instanceModel.delete();
  await botService.update({ is_connected: false });
}

export const evolutionApiService = {
  getQrCode,
  sendMessage,
  deleteInstance
}