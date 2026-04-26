import {
  clonePermissions,
  emptyPermissions,
  type CreateWorkerInput,
  type UpdateWorkerInput,
  type Worker,
  type WorkersResponseInterface,
} from "@/lib/types/worker";
import { ROLE_PRESETS } from "./role-presets";

// TODO BACKEND: reemplazar este store en memoria por llamadas Axios reales.
// Mientras tanto, sirve como datos de demostración para que el dueño vea
// la sección funcionando sin necesidad de endpoints.

const SIMULATED_LATENCY_MS = 350;

let seeded = false;
const store = new Map<string, Worker>();

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return `mock-worker-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function seedIfNeeded(businessId: string) {
  if (seeded) return;
  seeded = true;

  const seed: Worker[] = [
    {
      id: generateId(),
      businessId,
      fullName: "María González",
      phone: "+5358412233",
      email: "maria.gonzalez@example.com",
      avatar: null,
      rolePreset: "dependiente",
      permissions: clonePermissions(ROLE_PRESETS.dependiente),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
    },
    {
      id: generateId(),
      businessId,
      fullName: "Carlos Pérez",
      phone: "+5354887766",
      email: "carlos.perez@example.com",
      avatar: null,
      rolePreset: "contador",
      permissions: clonePermissions(ROLE_PRESETS.contador),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    },
    {
      id: generateId(),
      businessId,
      fullName: "Yulia Hernández",
      phone: "+5352224411",
      email: null,
      avatar: null,
      rolePreset: "almacenero",
      permissions: clonePermissions(ROLE_PRESETS.almacenero),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    },
    {
      id: generateId(),
      businessId,
      fullName: "Luis Rodríguez",
      phone: null,
      email: "luis.r@example.com",
      avatar: null,
      rolePreset: "custom",
      permissions: {
        ...emptyPermissions(),
        sales: { view: true, create: true },
        spents: { view: true, create: true },
        dailyClose: { view: true },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: generateId(),
      businessId,
      fullName: "Ana Torres",
      phone: "+5359988776",
      email: "ana.torres@example.com",
      avatar: null,
      rolePreset: "custom",
      permissions: {
        ...emptyPermissions(),
        products: { view: true, edit: true },
        inventory: { view: true, edit: true },
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    },
  ];

  for (const worker of seed) store.set(worker.id, worker);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export interface ListWorkersParams {
  businessId: string;
  page?: number;
  limit?: number;
}

export async function mockListWorkers({
  businessId,
  page = 1,
  limit = 5,
}: ListWorkersParams): Promise<WorkersResponseInterface> {
  seedIfNeeded(businessId);

  const all = Array.from(store.values())
    .filter((w) => w.businessId === businessId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const data = all.slice(start, start + limit);

  return delay({
    data,
    meta: { total, page: safePage, limit, totalPages },
  });
}

export async function mockGetWorkerById(
  workerId: string,
): Promise<Worker | null> {
  const worker = store.get(workerId);
  return delay(worker ? { ...worker, permissions: clonePermissions(worker.permissions) } : null);
}

export async function mockCreateWorker(
  input: CreateWorkerInput,
): Promise<Worker> {
  seedIfNeeded(input.businessId);

  const avatar = input.avatarFile ? await fileToDataUrl(input.avatarFile) : null;
  const worker: Worker = {
    id: generateId(),
    businessId: input.businessId,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    avatar,
    rolePreset: input.rolePreset,
    permissions: clonePermissions(input.permissions),
    createdAt: nowIso(),
  };

  store.set(worker.id, worker);
  return delay(worker);
}

export async function mockUpdateWorker(
  input: UpdateWorkerInput,
): Promise<Worker> {
  const existing = store.get(input.id);
  if (!existing) {
    throw new Error("Trabajador no encontrado");
  }

  const avatar = input.avatarFile
    ? await fileToDataUrl(input.avatarFile)
    : existing.avatar;

  const updated: Worker = {
    ...existing,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    avatar,
    rolePreset: input.rolePreset,
    permissions: clonePermissions(input.permissions),
  };

  store.set(updated.id, updated);
  return delay(updated);
}

export async function mockDeleteWorker(workerId: string): Promise<void> {
  store.delete(workerId);
  return delay(undefined);
}
