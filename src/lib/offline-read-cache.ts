import { offlineDb } from "@/lib/db/offline-db";

/**
 * Lecturas guardadas para poder mostrarlas sin conexión (plan offline, B4).
 *
 * La idea es deliberadamente simple: cada consulta que se envuelve guarda su
 * última respuesta correcta y, si una recarga falla por falta de red, se sirve
 * esa copia en vez de dejar la pantalla vacía.
 *
 * Lo que **no** hace, a propósito: no mezcla datos locales con los del
 * servidor, no reintenta por su cuenta y nunca sirve la copia estando en línea.
 * Con red manda siempre el servidor; la copia es un último recurso.
 */

/** Pasada esta antigüedad, la copia deja de servirse. */
export const READ_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedRead<T> {
  data: T;
  savedAt: Date;
}

/**
 * Guarda la respuesta. Nunca lanza: fallar al cachear no puede tumbar la
 * consulta que acaba de ir bien.
 */
export async function writeReadCache(
  key: string,
  businessId: string | null,
  data: unknown,
): Promise<void> {
  const db = offlineDb();
  if (!db) return;
  try {
    // `structuredClone` falla con lo que IndexedDB no sabe guardar (funciones,
    // proxies). Se comprueba aquí para que el error salte al guardar, no al
    // leer, cuando ya no hay forma de saber qué lo produjo.
    await db.readCache.put({
      key,
      businessId,
      savedAt: Date.now(),
      data: structuredClone(data),
    });
  } catch {
    // Sin cuota, en modo privado o con datos no clonables: se sigue sin caché.
  }
}

/**
 * Devuelve la copia guardada, o `undefined` si no hay o está caducada.
 * Las entradas caducadas se borran al leerlas.
 */
export async function readReadCache<T>(
  key: string,
  maxAgeMs: number = READ_CACHE_MAX_AGE_MS,
): Promise<CachedRead<T> | undefined> {
  const db = offlineDb();
  if (!db) return undefined;
  try {
    const row = await db.readCache.get(key);
    if (!row || typeof row.savedAt !== "number") return undefined;

    if (Date.now() - row.savedAt > maxAgeMs) {
      await db.readCache.delete(key);
      return undefined;
    }
    return { data: row.data as T, savedAt: new Date(row.savedAt) };
  } catch {
    return undefined;
  }
}

/**
 * Envuelve la función de una consulta para que, si falla por falta de red,
 * devuelva la última copia guardada.
 *
 * Solo se recurre a la copia cuando el fallo es de RED. Un 403 o un 422 son
 * respuestas legítimas del servidor —permiso denegado, datos inválidos— y
 * taparlas con datos viejos ocultaría el problema real.
 */
export function withOfflineFallback<T>(
  key: string,
  businessId: string | null,
  fetcher: () => Promise<T>,
): () => Promise<T> {
  return async () => {
    try {
      const data = await fetcher();
      void writeReadCache(key, businessId, data);
      return data;
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      const cached = await readReadCache<T>(key);
      if (cached) return cached.data;
      throw error;
    }
  };
}

/**
 * ¿El fallo es de red (no hubo respuesta) y no una respuesta de error?
 *
 * Axios deja `error.response` sin definir cuando no llegó a haber respuesta:
 * DNS, conexión rechazada, timeout o petición cancelada.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    isAxiosError?: boolean;
    response?: unknown;
    code?: string;
  };
  if (candidate.isAxiosError === true) return candidate.response === undefined;
  return candidate.code === "ERR_NETWORK";
}

/** Borra todas las copias. Se llama al cerrar sesión. */
export async function clearReadCache(): Promise<void> {
  const db = offlineDb();
  if (!db) return;
  try {
    await db.readCache.clear();
  } catch {
    // Sin acceso a la base: las copias caducarán solas.
  }
}
