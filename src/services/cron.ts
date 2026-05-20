import cron from "node-cron";
import { plansService } from "./plans";

function startCronJobs() {
  
  // Todo dia às 09:00 cobra planos aguardando pagamento
  cron.schedule("0 9 * * *", async () => {
    console.log("[CRON] Iniciando cobrança de planos aguardando pagamento...");
    try {
      await plansService.chargeAguardandoPgto();
      console.log("[CRON] Cobrança de planos concluída.");
    } catch (error) {
      console.error("[CRON] Erro ao cobrar planos:", error);
    }
  });
}

export { startCronJobs };
