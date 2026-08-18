import { formatMoney } from "@/lib/currency";
import {
  errorCode,
  errorMessage,
  errorStatus,
  isNetworkError,
} from "@/lib/http-error";
import type {
  OutboxCounts,
  OutboxError,
  OutboxOp,
  OutboxStatus,
} from "./outbox-types";

/**
 * Decisiones de la cola de operaciones (plan offline, B6).
 *
 * Todo lo de este módulo es puro: no toca IndexedDB, ni la red, ni el reloj
 * (el "ahora" siempre llega como argumento). Aquí vive lo que de verdad cuesta
 * acertar —cuándo reintentar, cuándo rendirse y cuándo hay que preguntarle a
 * la persona— y por eso está separado de la máquina que lo ejecuta: se puede
 * probar caso por caso sin navegador.
 */

/** Tope de operaciones por envío. Debe coincidir con el del backend. */
export const MAX_BATCH_OPERATIONS = 200;

/**
 * Intentos CON respuesta del servidor antes de dar una operación por
 * irrecuperable. Un fallo de red no gasta intentos: la operación nunca llegó,
 * así que no dice nada sobre si es válida.
 */
export const MAX_ATTEMPTS = 6;

export const RETRY_BASE_MS = 30_000;
export const RETRY_MAX_MS = 30 * 60_000;

/* ------------------------------------------------------- respuesta servidor */

/** Veredicto del servidor para una operación del lote. */
export interface SyncOperationResult {
  clientOperationId: string;
  status: "applied" | "failed";
  entityId?: string | null;
  duplicate?: boolean;
  data?: unknown;
  error?: { code: string; message: string };
  warnings?: string[];
}

export interface SyncPushResponse {
  batchId: string;
  serverTime: string;
  results: SyncOperationResult[];
  summary: { applied: number; failed: number; duplicate: number };
}

/* --------------------------------------------------------------- reintentos */

/**
 * Espera antes del siguiente intento: 30 s, 1 min, 2 min… con tope de 30 min.
 *
 * Sin componente aleatorio a propósito. Repartir los reintentos sirve para que
 * miles de clientes no golpeen a la vez tras una caída; aquí los dispara la
 * persona o la vuelta de la conexión, que ya están repartidos por sí solos, y
 * un retraso predecible es mucho más fácil de explicar y de probar.
 */
export function retryDelayMs(attempts: number): number {
  const exponent = Math.max(0, attempts - 1);
  return Math.min(RETRY_BASE_MS * 2 ** exponent, RETRY_MAX_MS);
}

/** ¿Toca subir esta operación ahora? */
export function isDue(op: OutboxOp, now: number): boolean {
  if (op.status === "pending") return true;
  if (op.status !== "failed") return false;
  return (op.nextAttemptAt ?? 0) <= now;
}

/** Parte la cola en envíos del tamaño que admite el servidor. */
export function chunkOperations<T>(
  ops: T[],
  size: number = MAX_BATCH_OPERATIONS,
): T[][] {
  if (size <= 0) throw new Error("El tamaño del lote debe ser mayor que cero.");
  const chunks: T[][] = [];
  for (let i = 0; i < ops.length; i += size) {
    chunks.push(ops.slice(i, i + size));
  }
  return chunks;
}

/* ------------------------------------------------- fallo de TODO el envío */

/**
 * Qué hacer cuando falla la petición entera, no una operación suelta.
 *
 * - `retry`: no es culpa de las operaciones; se quedan en cola tal cual.
 * - `pause`: seguir intentando no arregla nada hasta que la persona actúe
 *   (sesión caducada, plan vencido). La cola se detiene y se explica por qué.
 * - `reject`: el servidor rechazó la forma del envío. Reintentar daría siempre
 *   lo mismo, así que se marca para que se vea en vez de girar en el vacío.
 */
export type TransportVerdict =
  | {
      kind: "retry";
      reason: "network" | "server" | "throttled";
      message: string;
    }
  | { kind: "pause"; reason: "session" | "plan"; message: string }
  | { kind: "reject"; reason: "batch"; message: string };

export function classifyPushFailure(error: unknown): TransportVerdict {
  if (isNetworkError(error)) {
    return {
      kind: "retry",
      reason: "network",
      message: "No hay conexión con el servidor. Tus cambios siguen guardados.",
    };
  }

  const status = errorStatus(error);

  if (status === 401) {
    return {
      kind: "pause",
      reason: "session",
      message:
        "Tu sesión caducó. Inicia sesión otra vez para subir los cambios; " +
        "no se ha perdido ninguno.",
    };
  }
  if (status === 403) {
    return {
      kind: "pause",
      reason: "plan",
      message: errorMessage(
        error,
        "El plan del negocio no permite subir cambios ahora mismo.",
      ),
    };
  }
  if (status === 429) {
    return {
      kind: "retry",
      reason: "throttled",
      message: "El servidor pidió esperar un momento. Se reintentará solo.",
    };
  }
  if (status !== null && status >= 500) {
    return {
      kind: "retry",
      reason: "server",
      message: "El servidor tuvo un problema. Se reintentará solo.",
    };
  }
  if (status !== null && status >= 400) {
    return {
      kind: "reject",
      reason: "batch",
      message: errorMessage(
        error,
        "El servidor rechazó el envío. Revisa los cambios pendientes.",
      ),
    };
  }

  return {
    kind: "retry",
    reason: "server",
    message: "No se pudo completar el envío. Se reintentará solo.",
  };
}

/* ----------------------------------------------- fallo de UNA operación */

/**
 * Códigos por los que merece la pena reintentar una operación concreta.
 *
 * `IDEMPOTENCY_IN_PROGRESS` es el caso interesante: significa que el servidor
 * está procesando esta misma operación justo ahora —llegó por la vía en línea
 * y la respuesta se perdió—. Reintentar más tarde devolverá el resultado ya
 * guardado; darla por rechazada haría que la persona la volviera a registrar y
 * acabaría duplicada.
 */
export const RETRYABLE_OPERATION_CODES = new Set([
  "IDEMPOTENCY_IN_PROGRESS",
  "SYNC_ERROR_INTERNO",
]);

export function isRetryableOperationCode(
  code: string | null | undefined,
): boolean {
  // Sin código no se puede decidir; se reintenta. El tope de intentos evita
  // que un fallo permanente sin identificar gire para siempre.
  if (!code) return true;
  if (RETRYABLE_OPERATION_CODES.has(code)) return true;
  const numeric = Number(code);
  return Number.isFinite(numeric) && (numeric >= 500 || numeric === 429);
}

/** Nuevo estado de una operación tras conocerse el veredicto del servidor. */
export interface OperationOutcome {
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt: number | null;
  lastError: OutboxError | null;
  needsManualCheck: boolean;
  entityId: string | null;
}

export function resolveOperationOutcome(
  op: Pick<OutboxOp, "attempts">,
  result: SyncOperationResult,
  now: number,
): OperationOutcome {
  if (result.status === "applied") {
    return {
      status: "done",
      attempts: op.attempts,
      nextAttemptAt: null,
      lastError: null,
      // Ya está en el servidor: la duda de si llegó queda resuelta.
      needsManualCheck: false,
      entityId: result.entityId ?? null,
    };
  }

  const attempts = op.attempts + 1;
  const code = result.error?.code ?? null;
  const lastError: OutboxError = {
    at: now,
    code,
    message: result.error?.message ?? "El servidor rechazó la operación.",
    status: null,
  };

  const retryable = isRetryableOperationCode(code) && attempts < MAX_ATTEMPTS;
  return {
    status: retryable ? "failed" : "rejected",
    attempts,
    nextAttemptAt: retryable ? now + retryDelayMs(attempts) : null,
    lastError,
    needsManualCheck: false,
    entityId: null,
  };
}

/**
 * Estado de una operación que se envió pero de la que el servidor no dijo
 * nada. No debería ocurrir; si ocurre, dejarla esperando en `inflight` sería
 * peor que devolverla a la cola, porque `inflight` no se reintenta nunca.
 */
export function outcomeForMissingResult(
  op: Pick<OutboxOp, "attempts">,
  now: number,
): OperationOutcome {
  const attempts = op.attempts + 1;
  const retryable = attempts < MAX_ATTEMPTS;
  return {
    status: retryable ? "failed" : "rejected",
    attempts,
    nextAttemptAt: retryable ? now + retryDelayMs(attempts) : null,
    lastError: {
      at: now,
      code: "SYNC_SIN_RESPUESTA",
      message: "El servidor no informó del resultado de esta operación.",
      status: null,
    },
    needsManualCheck: true,
    entityId: null,
  };
}

/** Error de transporte en la forma que guarda la operación. */
export function transportError(
  error: unknown,
  message: string,
  now: number,
): OutboxError {
  return {
    at: now,
    code: errorCode(error),
    message,
    status: errorStatus(error),
  };
}

/* -------------------------------------------------------------- etiquetas */

interface SalePayloadLike {
  currency?: unknown;
  items?: unknown;
}

/**
 * Texto de una operación para la lista de pendientes.
 *
 * Se calcula al encolar y se guarda con la operación: si el catálogo cambia
 * después, la etiqueta debe seguir describiendo lo que se registró, no lo que
 * hay ahora.
 */
export function describeSaleOperation(payload: unknown): string {
  const sale = (payload ?? {}) as SalePayloadLike;
  const items = Array.isArray(sale.items) ? sale.items : [];
  // `formatMoney` ya normaliza la forma del backend (`cup_transferencia`) al
  // nombre que se muestra, así que la moneda se le pasa tal como se encoló.
  const currency = typeof sale.currency === "string" ? sale.currency : "CUP";

  const total = items.reduce((sum: number, raw) => {
    const item = raw as { quantity?: unknown; price?: unknown };
    return sum + Number(item.quantity ?? 0) * Number(item.price ?? 0);
  }, 0);

  const unidades =
    items.length === 1 ? "1 producto" : `${items.length} productos`;
  return `Venta · ${unidades} · ${formatMoney(total, currency)}`;
}

/* --------------------------------------------------------------- resumen */

export function countOutbox(ops: Pick<OutboxOp, "status">[]): OutboxCounts {
  const counts = { pending: 0, failed: 0, rejected: 0, inflight: 0 };
  for (const op of ops) {
    if (op.status in counts) counts[op.status as keyof typeof counts] += 1;
  }
  return {
    ...counts,
    // Lo que se le enseña a la persona: todo lo que aún no está en el
    // servidor, sin importar por qué. Separar "pendiente" de "con error" en el
    // contador principal solo consigue que parezca que hay menos trabajo sin
    // subir del que hay.
    unsynced:
      counts.pending + counts.failed + counts.rejected + counts.inflight,
  };
}
