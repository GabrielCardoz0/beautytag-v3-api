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
        await botService.update({ is_connected: false });
        break;
  
      case "remove.instance":
        await instanceModel.delete();
        await botService.update({ is_connected: false });
        await instanceModel.update(instanceRef.id, { is_connected: false });
        break;
  
      case "qrcode.updated":
        await instanceModel.update(instanceRef.id, { base64: data.qrcode.base64 });
        break;
  
      case "messages.upsert":
        const message = data.message.conversation;
        const remoteJid = data.key.remoteJidAlt;
        const isFromMe = data.key.fromMe;
  
        console.log("aqui");
  
        if(data.messageType !== "conversation") return
  
        // console.log('messages.upsert', instance, data);
  
        const [ number, type ] = remoteJid?.split("@") ?? [];
  
        if(type !== "s.whatsapp.net") return;
  
        // const user = await usersService.getByWhatsapp(number);
  
        if(number === '5511994703386') {
          console.log("OI");
          const botResponse = await getAgentResponse(remoteJid, message, number)
          evolutionApiService.sendMessage({
            number: remoteJid,
            text: botResponse ?? "resposta automática teste"
          });
        }
  
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