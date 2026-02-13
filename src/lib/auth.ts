import axios from "axios";
import { authRoutes } from "@/lib/routes/auth";
import type { LoginFormData } from "@/lib/validations/auth";

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
  const { data } = await axios.post<AuthResponse>(authRoutes.login, credentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return data;
}

export async function register(credentials: LoginFormData): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(authRoutes.register, credentials, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return data;
}