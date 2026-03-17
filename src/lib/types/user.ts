export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  provider: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface UserResponseOfRegister {
    id: string;
    email: string;
    name: string;
    active: boolean;
    pageId: string;
}

export interface UserDataResponse {
  id: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  pageId: string;
  rol: string | null;
  active: number;
  twoFactorEnabled: boolean;
  plan: Plan | null
  providers: Provider[];
  hasPassword: boolean;
  name: string;
  _source: string;
}

type Provider = {
  id: number;
  provider: string;
  externalId: string;
  avatar: string;
  createdAt: string;
}

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}