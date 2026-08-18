/**
 * Lectura de errores de red y de HTTP, sin depender de axios ni de IndexedDB.
 *
 * Vive aparte para que la lógica pura de la cola (`offline/outbox-policy`) y
 * sus pruebas puedan usarla sin arrastrar la base de datos local.
 */

interface HttpErrorLike {
  isAxiosError?: boolean;
  code?: string;
  response?: { status?: number; data?: unknown };
}

function asHttpError(error: unknown): HttpErrorLike | null {
  return error && typeof error === "object" ? (error as HttpErrorLike) : null;
}

/**
 * ¿El fallo es de red (no hubo respuesta) y no una respuesta de error?
 *
 * Axios deja `error.response` sin definir cuando no llegó a haber respuesta:
 * DNS, conexión rechazada, timeout o petición cancelada.
 */
export function isNetworkError(error: unknown): boolean {
  const candidate = asHttpError(error);
  if (!candidate) return false;
  if (candidate.isAxiosError === true) return candidate.response === undefined;
  return candidate.code === "ERR_NETWORK";
}

/** Código HTTP de la respuesta, o null si no llegó a haber respuesta. */
export function errorStatus(error: unknown): number | null {
  const status = asHttpError(error)?.response?.status;
  return typeof status === "number" ? status : null;
}

/**
 * Mensaje que el backend quiso mostrar, si lo hay.
 *
 * Se prefiere siempre al mensaje genérico de axios ("Request failed with
 * status code 409"), que no le dice nada a la persona que está vendiendo.
 */
export function errorMessage(error: unknown, fallback: string): string {
  const data = asHttpError(error)?.response?.data as
    | { mensaje?: unknown; message?: unknown }
    | undefined;
  if (typeof data?.mensaje === "string" && data.mensaje) return data.mensaje;
  if (typeof data?.message === "string" && data.message) return data.message;
  if (Array.isArray(data?.message)) {
    const parts = data.message.filter((m): m is string => typeof m === "string");
    if (parts.length > 0) return parts.join("; ");
  }
  return fallback;
}

/** Código estable del backend (`codigo`), si lo trae. */
export function errorCode(error: unknown): string | null {
  const data = asHttpError(error)?.response?.data as
    | { codigo?: unknown }
    | undefined;
  return typeof data?.codigo === "string" ? data.codigo : null;
}
