import { Router } from "express";
import { evolutionApiService } from "./service";
import { evolutionWebhooks } from "./webhooks";

const evolutionRouter = Router();

evolutionRouter
  .get("/qrcode", async (req, res) => {
    try {
      const qrcode = await evolutionApiService.getQrCode();
      // formato: qrcode = { base64: string }
      return res.send(qrcode);
    } catch (error: any) {
      console.log(error);
      return res.status(400).send({ message: error.response.data ?? 'Erro durante a requisição' });
    }
  })

  .post("/webhooks", async (req, res) => {
    try {
      await evolutionWebhooks.handleEvent(req.body);
      return res.send({ message: 'ok' });
    } catch (error: any) {
      console.log(error);
      return res.status(400).send({ message: error.response.data ?? 'Erro durante a requisição' });
    }
  })
;

export { evolutionRouter };