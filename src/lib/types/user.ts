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