import { botModel } from "../../models/bot";
import { instanceModel } from "../../models/instance";
import { botService } from "../bot";
import { getAgentResponse } from "../openai/agent";
import { usersService } from "../users";
import { evolutionApiService } from "./service";

const handleEvent = async (params: {event: string, instance: string, data: any}) => {
  try {
    const { event, instance, data } = params;
  
    const instanceRef = await instanceModel.get();
  
    if(!instanceRef) return;
  
    switch (event) {
      case "connection.update":
        if (data.state === "open") {
          await instanceModel.update(instanceRef.id, { is_connected: true, whatsapp: data.wuid.split('@')[0] });
          await botService.update({ is_connected: true });
        }
        break;
  
      case "logout.instance":
        await instanceModel.update(instanceRef.id, { is_connected: false });
        await instanceModel.delete();
        await botService.update({ is_connected: false });
        break;
  
      case "remove.instance":
        await instanceModel.update(instanceRef.id, { is_connected: false });
        await instanceModel.delete();
        await botService.update({ is_connected: false });
        break;
  
      case "qrcode.updated":
        await instanceModel.update(instanceRef.id, { base64: data.qrcode.base64 });
        break;
  
      case "messages.upsert":
        const message = data.message.conversation;
        const remoteJid = data.key.remoteJidAlt;
        const isFromMe = data.key.fromMe;

        if(data.messageType !== "conversation" || isFromMe) return

        const [ number, type ] = remoteJid?.split("@") ?? [];

        if(type !== "s.whatsapp.net") return;

        const bot = await botModel.get();

        if (!bot?.is_active || !bot?.is_connected) return;

        if (bot.start_time != null && bot.end_time != null) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          if (currentMinutes < bot.start_time || currentMinutes >= bot.end_time) {
            if (bot.out_of_turn_msg) {
              await evolutionApiService.sendMessage({
                number: remoteJid,
                text: bot.out_of_turn_msg
              });
            }
            return;
          }
        }

        if (bot.response_time && bot.response_time > 0) {
          await new Promise(resolve => setTimeout(resolve, bot.response_time! * 1000));
        }

        // const user = await usersService.getByWhatsapp(number);

        const botResponse = await getAgentResponse(remoteJid, message, number);

        evolutionApiService.sendMessage({
          number: remoteJid,
          text: botResponse ?? "Perdão, não consegui entender sua mensagem. Poderia reformular ou tentar novamente mais tarde?"
        });

        break;
  
      default:
        console.warn(`Unhandled event: ${event} for instance ${instance}`);
        break;
    }
  } catch (error) {
    console.log(error);
    return
  }
}

export const evolutionWebhooks = {
  handleEvent
}