// TODO BACKEND: definir endpoints reales cuando estén disponibles.
// Esta sección está montada visualmente con un store en memoria
// (src/lib/workers/mock-workers.ts) hasta que el backend nos entregue
// los endpoints, payloads y respuestas.

export const workersRoutes = {
  getAllByBusinessId: (businessId: string) => `/workers/business/${businessId}`,
  getById: (workerId: string) => `/workers/${workerId}`,
  create: `/workers`,
  update: (workerId: string) => `/workers/${workerId}`,
  delete: (workerId: string) => `/workers/${workerId}`,
};
