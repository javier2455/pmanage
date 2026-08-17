import { BASIC_ROUTE } from ".";

export const SyncRoutes = {
  /** Sondeo de conectividad. Público y barato; ver `use-connectivity`. */
  health: () => `${BASIC_ROUTE}/sync/health`,
  /** Subida de un lote de operaciones hechas sin conexión. */
  push: () => `${BASIC_ROUTE}/sync/push`,
};
