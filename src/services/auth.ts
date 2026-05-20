import { usersModel } from "../models/users";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

async function login({  email, password }: { email: string, password: string }) {
  const findedUser = await usersModel.getByEmail(email);

  if(!findedUser) {
    throw new Error("Usuário não encontrado.");
  }

  const isValidPassword = await verifyPassword({ password, comparePassword: findedUser.password });

  // console.log(isValidPassword, password, findedUser.password);

  if(!isValidPassword) {
    throw new Error("Senha ou email incorreto.");
  }

  return jwt.sign({ userId: findedUser.id }, process.env.JWT_SECRET!)
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10)
}

export async function verifyPassword({ password, comparePassword }: { password: string, comparePassword: string }) {
  // return password === comparePassword
  return await bcrypt.compare(password, comparePassword);
}


export const authService = {
  login,
  hashPassword,
  verifyPassword,
}