import axios from "axios";
import { authRoutes } from "@/lib/routes/auth";
import type { LoginFormData, RegisterFormData } from "@/lib/validations/auth";

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


export async function login(credentials: LoginFormData): Promise<AuthResponse> {
  const { data } = await axios.post(authRoutes.login, credentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return data;
}

export async function register(credentials: RegisterFormData) {
  const { email, name, password } = credentials
  console.log('credentials of register before sent post', { email, name, password });
  const { data } = await axios.post(authRoutes.register, { email, name, password }, {
    headers: {
      "Content-Type": "application/json",
    },
  });

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

export async function resendCode(): Promise<{ message: string }> {
  const { data } = await axios.post<{ message: string }>(authRoutes.resend, {}, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return data;
}