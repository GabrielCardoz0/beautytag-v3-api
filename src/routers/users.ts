import { Router } from "express";
import Joi from "joi";
import { validateBody } from "../services/middlewares/validate-schema";
import { usersController } from "../controllers/users";
import { EnumRoles, validateRole } from "../services/middlewares/validate-role";
import { authenticateToken } from "../services/middlewares/auth";
import { Prisma } from "../generated/prisma/client";

const usersRouter = Router();

export interface ICreateParceiro {
  name: string; // Nome do parceiro (ex: "João Silva")
  email: string; // E-mail do parceiro (ex: "joao@empresa.com")
  metadata: {
    // existentes
    cnpj: string; // CNPJ da empresa (ex: "12345678000199")
    whatsapp: string; // Telefone/WhatsApp (ex: "11999999999")
    cep?: string; // CEP (ex: "01001000")
    rua?: string; // Rua (ex: "Av. Paulista")
    numero?: string; // Número (ex: "1000")
    bairro?: string; // Bairro (ex: "Bela Vista")
    cidade?: string; // Cidade (ex: "São Paulo")
    estado?: string; // Estado (ex: "SP")
    instagram?: string; // Instagram (ex: "@meu_estabelecimento")
  };
}

export interface IUpdateParceiro {
  name?: string,
  email?: string,
  pagarme_id?: string,
  metadata?: {
    cnpj?: string,
    whatsapp?: string,
    cep?: string,
    rua?: string,
    numero?: string,
    bairro?: string,
    cidade?: string,
    estado?: string,
    instagram?: string,
  }
}

const UserSchema = Joi.object<ICreateParceiro>({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  // metadata: Joi.object({
  //   cnpj: Joi.string().required(),
  //   whatsapp: Joi.string().required(),
  //   cep: Joi.string().required(),
  //   rua: Joi.string().required(),
  //   numero: Joi.string().required(),
  //   bairro: Joi.string().required(),
  //   cidade: Joi.string().required(),
  //   estado: Joi.string().required(),
  // })

  metadata: Joi.object({
    // existentes
    cnpj: Joi.string().required(),
    whatsapp: Joi.string().required(),
    cep: Joi.string().optional().allow(''),
    rua: Joi.string().optional().allow(''),
    numero: Joi.string().optional().allow(''),
    bairro: Joi.string().optional().allow(''),
    cidade: Joi.string().optional().allow(''),
    estado: Joi.string().optional().allow('').max(2),
    instagram: Joi.string().optional().allow(''),
  }).required()
});

const UpdateParceiroSchema = Joi.object<IUpdateParceiro>({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  pagarme_id: Joi.string().optional(),
  metadata: Joi.object({
    cnpj: Joi.string().optional(),
    whatsapp: Joi.string().optional(),
    cep: Joi.string().optional(),
    rua: Joi.string().optional(),
    numero: Joi.string().optional(),
    bairro: Joi.string().optional(),
    cidade: Joi.string().optional(),
    estado: Joi.string().optional(),
    instagram: Joi.string().optional().allow(''),
  })
  
});

usersRouter
  .use(authenticateToken)
  .get("/me", usersController.getMe)
  .get("/", validateRole([EnumRoles.admin]), usersController.getAll)
  .get("/client", validateRole([EnumRoles.admin, EnumRoles.parceiro]), usersController.getClientByPhone)
  .get("/:id", validateRole([EnumRoles.admin]), usersController.getById)
  .post("/", validateRole([EnumRoles.admin]), validateBody(UserSchema), usersController.create)
  .delete("/:id", validateRole([EnumRoles.admin]), usersController.delete)
  .put("/:id", validateRole([EnumRoles.admin]), validateBody(UpdateParceiroSchema), usersController.update)

export { usersRouter };
