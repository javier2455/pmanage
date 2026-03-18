import apiClient from "@/lib/axios";
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

interface AuthDataResponse {
  id: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  pageId: string;
  rol: Role;
  active: number;
  twoFactorEnabled: boolean;
  providers: [];
  hasPassword: boolean;
  name: string;
  _source: string;
  plan: Plan;
}

interface Role {
  id: number;
  name: string;
  pageId: string;
  permission: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  type: string;
  price: string;
  maxProducts: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export async function login(credentials: LoginFormData): Promise<LoginResponse> {
  const { data } = await apiClient.post(authRoutes.login, credentials);
  return data;
}

export async function register(credentials: RegisterFormData): Promise<UserResponseOfRegister> {
  const { email, name, password, rolId } = credentials
  const { data } = await apiClient.post(authRoutes.register, { email, name, password, rolId });
  return data;
}

export async function verifyCode(credentials: { email: string, code: string }): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(authRoutes.verify, credentials);
  return data;
}

export async function resendCode({ email }: { email: string }) {
  await apiClient.post(authRoutes.sendConfirmationToken(email));
  return { message: 'Código de verificación reenviado, verifique su email' };
}

export async function getMe(): Promise<AuthDataResponse> {
  const { data } = await apiClient.get(authRoutes.me);
  return data;
}