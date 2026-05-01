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
  expiredPlan: boolean,
  hasNeverHadPlan: boolean,
  isOwner: boolean,
  isWorker: boolean
}

export interface InvitationPermission {
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
  download: boolean;
  all: boolean;
  menuId?: string;
  subMenuId?: string;
}

export interface InvitationInformationData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  job: string | null;
  permissions: InvitationPermission[];
  businessId: string;
  expirationDate: string;
  used: boolean;
  usedAt: string | null;
  userId: string | null;
  business: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InvitationInformationResponse {
  message: string;
  expired: boolean;
  data: InvitationInformationData;
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
  startDate: string;
  expireDate: string;
}


export async function login(credentials: LoginFormData): Promise<LoginResponse> {
  const { data } = await apiClient.post(authRoutes.login, credentials);
  return data;
}

export async function register(credentials: RegisterFormData): Promise<UserResponseOfRegister> {
  const { email, name, password, rolId, invitationId } = credentials;
  const body = invitationId
    ? { email, name, password, invitationId }
    : { email, name, password, rolId };
  const { data } = await apiClient.post(authRoutes.register, body);
  // const { data } = await apiClient.post(authRoutes.register, body);
  return data;
}

export async function getInvitationInformation(
  invitationId: string,
): Promise<InvitationInformationResponse> {
  const { data } = await apiClient.get<InvitationInformationResponse>(
    authRoutes.invitationInformation(invitationId),
  );
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

export async function requestPasswordReset(payload: {
  email: string;
  urlCallback: string;
}) {
  const { data } = await apiClient.post(
    authRoutes.requestPasswordReset,
    payload,
  );
  return data;
}

export async function changePassword(payload: {
  password: string;
  token: string;
}) {
  const { data } = await apiClient.post(authRoutes.changePassword, payload);
  return data;
}