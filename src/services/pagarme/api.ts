import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;


const headerAuthorizationPagarme = () => `Basic ${Buffer.from(PAGARME_API_KEY + ":").toString("base64")}`;

const pagarme = axios.create({
  baseURL: "https://api.pagar.me/core/v5",
  headers: {
    Authorization: headerAuthorizationPagarme(),
    "Content-Type": "application/json"
  }
});

interface PlanServiceForSplit {
  frequency: string;
  service: {
    price: number;
    percent_tax: number;
    user: {
      pagarme_id: string | null;
    };
  };
}

async function createPaymentLink(
  amount: number,
  client: { name: string; email: string; cpf: string; whatsapp: string },
  planServices: PlanServiceForSplit[],
  orderCode: string
): Promise<{ paymentUrl: string; linkId: string }> {
  try {
    const beautyTagRecipientId = process.env.PAGARME_BEAUTY_TAG_RECIPIENT_ID!;
    const splitMap = new Map<string, number>();

    for (const ps of planServices) {
      const { price, percent_tax, user } = ps.service;
      const freq = parseInt(ps.frequency);
      const totalPrice = price * freq;
      const beautyTagAmount = Math.round(totalPrice * percent_tax / 100);
      const parceiroAmount = totalPrice - beautyTagAmount;

      splitMap.set(beautyTagRecipientId, (splitMap.get(beautyTagRecipientId) ?? 0) + beautyTagAmount);

      if (user.pagarme_id) {
        splitMap.set(user.pagarme_id, (splitMap.get(user.pagarme_id) ?? 0) + parceiroAmount);
      } else {
        splitMap.set(beautyTagRecipientId, (splitMap.get(beautyTagRecipientId) ?? 0) + parceiroAmount);
      }
    }

    const rules = Array.from(splitMap.entries()).map(([recipient_id, splitAmount]) => ({
      recipient_id,
      amount: splitAmount,
      type: "flat",
      options: {
        charge_processing_fee: recipient_id === beautyTagRecipientId,
        liable: recipient_id === beautyTagRecipientId,
        charge_remainder_fee: recipient_id === beautyTagRecipientId,
      },
    }));

    const response = await pagarme.post("/paymentlinks", {
      type: "order",
      name: `PLANO BEAUTY TAG - ${client.name}`.slice(0, 64),
      order_code: orderCode,
      max_paid_sessions: 1,
      payment_settings: {
        accepted_payment_methods: ["credit_card"],
        credit_card_settings: {
          installments_setup: {
            interest_type: "simple"
          }
        }
      },
      customer_settings: {
        customer: {
          name: client.name,
          email: client.email,
          type: "individual",
          document: client.cpf.replace(/\D/g, ""),
          document_type: "CPF",
          phones: {
            mobile_phone: {
              country_code: "55",
              area_code: client.whatsapp.replace(/\D/g, "").slice(0, 2),
              number: client.whatsapp.replace(/\D/g, "").slice(2)
            }
          }
        }
      },
      cart_settings: {
        items: [
          {
            name: `PLANO BEAUTY TAG - ${client.name} | ${client.cpf}`.slice(0, 64),
            amount: amount,
            default_quantity: 1
          }
        ]
      },
      split_settings: {
        rules
      },
      flow_settings: {
        success_url: "https://google.com"
      }
    });

    return {
      paymentUrl: response.data.url,
      linkId: response.data.id,
    };
  } catch (error: any) {
    console.log(error?.response?.data ?? error);
    throw new Error("Erro ao criar link de pagamento na Pagar.me");
  }
}

async function getPaymentUrl(linkId: string): Promise<string | null> {
  try {
    const response = await pagarme.get(`/paymentlinks/${linkId}`);

    if (response.data.status !== "active") return null;

    return response.data.url ?? null;
  } catch (error: any) {
    console.log(error?.response?.data ?? error);
    return null;
  }
}

export const pagarmeApi = {
  createPaymentLink,
  getPaymentUrl,
  api: pagarme
}