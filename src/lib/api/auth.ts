import axios from "axios";
import { authRoutes } from "@/lib/routes/auth";
import type { LoginFormData, RegisterFormData } from "@/lib/validations/auth";
import { LoginResponse, UserResponseOfRegister } from "../types/user";

interface LoginDataResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AuthResponse {
  data: LoginDataResponse;
  message?: string;
}


export async function login(credentials: LoginFormData): Promise<LoginResponse> {
  const { data } = await axios.post(authRoutes.login, credentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return data;
}

export async function register(credentials: RegisterFormData): Promise<UserResponseOfRegister> {
  const { email, name, password, rolId } = credentials
  console.log('credentials of register before sent post', { email, name, password, rolId });
  const { data } = await axios.post(authRoutes.register, { email, name, password, rolId }, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log('data of register', data);
  return data;
}

export async function verifyCode(credentials: { email: string, code: string }): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(authRoutes.verify, credentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
}

export async function resendCode({ email }: { email: string }) {
  await axios.post(authRoutes.sendConfirmationToken(email), {
    headers: {
      "Content-Type": "application/json",
    }
  });
  return { message: 'Código de verificación reenviado, verifique su email' };
}