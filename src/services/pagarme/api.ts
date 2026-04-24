import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;

// interface CreateReceiverRequest {
//   register_information: {
//     email: string; // E-mail do recebedor (ex: "financeiro@empresa.com")
//     document: string; // CNPJ do recebedor (ex: "12345678000199")
//     type: 'corporation'; // Tipo do recebedor PJ (sempre "corporation")

//     company_name: string; // Nome fantasia da empresa (ex: "Tech Soluções")
//     trading_name: string; // Razão social da empresa (ex: "Tech Soluções Ltda")
//     annual_revenue: number; // Receita anual (ex: 5000000)
//     phone_numbers: {
//       ddd: string; // DDD do telefone (ex: "11")
//       number: string; // Número do telefone (ex: "987654321")
//       type: string;
//     }[]
//   };

//   default_bank_account: {
//     holder_name: string; // Nome do titular da conta (ex: "Tech Soluções Ltda")
//     holder_type: 'company'; // Tipo do titular PJ (sempre "company")
//     holder_document: string; // CNPJ do titular (ex: "12345678000199")
//     bank: string; // Código do banco (ex: "001")
//     branch_number: string; // Número da agência (ex: "1234")
//     account_number: string; // Número da conta (ex: "12345678")
//     account_check_digit: string; // Dígito verificador da conta (ex: "9")
//     type: 'checking' | 'savings'; // Tipo da conta (ex: "checking")
//   };
// }

interface CreateReceiverRequest {
  register_information: {
    email: string;
    document: string;
    type: 'corporation';

    company_name: string;
    trading_name: string;
    annual_revenue: number;

    phone_numbers: {
      ddd: string;
      number: string;
      type: string;
    }[];

    main_address: {
      street: string;
      complementary: string;
      street_number: string;
      neighborhood: string;
      city: string;
      state: string;
      zip_code: string;
      reference_point: string;
    };

    managing_partners: {
      name: string;
      email: string;
      document: string;
      type: string;
      mother_name: string;
      birthdate: string;
      monthly_income: number;
      professional_occupation: string;
      self_declared_legal_representative: boolean;
      address: {
        street: string;
        complementary: string;
        street_number: string;
        neighborhood: string;
        city: string;
        state: string;
        zip_code: string;
        reference_point: string;
      }
    }[];
  };

  default_bank_account: {
    holder_name: string;
    holder_type: 'company';
    holder_document: string;
    bank: string;
    branch_number: string;
    account_number: string;
    account_check_digit: string;
    type: 'checking' | 'savings';
  };
}

const headerAuthorizationPagarme = () => `Basic ${Buffer.from(PAGARME_API_KEY + ":").toString("base64")}`;

const pagarme = axios.create({
  baseURL: "https://api.pagar.me/core/v5",
  headers: {
    Authorization: headerAuthorizationPagarme(),
    "Content-Type": "application/json"
  }
});

async function createPaymentLink(amount: number,  client: { name: string, email: string, cpf: string, whatsapp: string }): Promise<string> {
  try {

    const response = await pagarme.post("/orders", {
      items: [
        {
          amount: amount,
          description: `PLANO BEAUTY TAG - ${client.name} | ${client.cpf}`,
          quantity: 1
        }
      ],
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
      },
      payments: [
        {
          payment_method: "checkout",
          checkout: {
            success_url: "https://google.com",
            customer_editable: true,
            accepted_payment_methods: ["credit_card"]
          }
        }
      ]
    });

    // const response = await axios.post(
    //   "https://api.pagar.me/core/v5/orders",
    //   {
    //     items: [
    //       {
    //         amount: 1,
    //         // amount: amount,
    //         description: `PLANO BEAUTY TAG - ${client.name} | ${client.cpf}`,
    //         quantity: 1
    //       }
    //     ],
    //     customer: {
    //       name: client.name,
    //       email: client.email,
    //       type: "individual",
    //       document: client.cpf.replace(/\D/g, ""),
    //       document_type: "CPF",
    //       phones: {
    //         mobile_phone: {
    //           country_code: "55",
    //           area_code: client.whatsapp.replace(/\D/g, "").slice(0, 2),
    //           number: client.whatsapp.replace(/\D/g, "").slice(2)
    //         }
    //       }
    //     },
    //     payments: [
    //       {
    //         payment_method: "checkout",
    //         checkout: {
    //           success_url: "https://google.com",
    //           customer_editable: true,
    //           accepted_payment_methods: ["credit_card"]
    //         }
    //       }
    //     ]
    //   },
    //   {
    //     headers: {
    //       Authorization: headerAuthorizationPagarme(),
    //       "Content-Type": "application/json"
    //     }
    //   }
    // );

    return response.data.checkouts[0].payment_url;
  } catch (error: any) {
    console.log(error?.response?.data ?? error);
    throw new Error("Erro ao criar link de pagamento na Pagar.me");
  }
}

export const pagarmeApi = {
  createPaymentLink,
}