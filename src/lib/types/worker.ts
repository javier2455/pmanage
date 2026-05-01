export interface Worker {
  id: string;
  userId: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  name: string | null;
  businessId: string;
  rol: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkersResponseInterface {
  message?: string;
  data: Worker[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WorkerPermissoEntry {
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
  download: boolean;
  all: boolean;
  menuId?: string;
  subMenuId?: string;
}

export interface CreateWorkerInput {
  businessId: string;
  name: string;
  email: string;
  phone: string;
  job: string;
  permisos: WorkerPermissoEntry[];
}

export interface CreateWorkerResponse {
  message: string;
  data: Worker;
}
