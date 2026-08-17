/**
 * Caché local de lecturas que la aplicación necesita para poder usarse sin
 * conexión (plan offline, primer trozo de B4).
 *
 * La caché de React Query vive **solo en memoria**: al recargar la página —o al
 * entrar directamente estando sin red— se pierde, la consulta falla y la
 * pantalla se queda vacía. Con el service worker la aplicación abre, pero sin
 * esto el sidebar aparecía sin secciones ni menús y el usuario no podía
 * navegar a ningún sitio: la app abría, pero no servía para nada.
 *
 * Se usa `localStorage` y no IndexedDB porque lo que se guarda aquí es
 * pequeño y de lectura síncrona (el árbol de navegación). Los datos de negocio
 * —productos, ventas, inventario— irán a IndexedDB con Dexie, que es lo que
 * corresponde a su volumen.
 *
 * Nada de lo guardado aquí es sensible: es la estructura del menú.
 */

const PREFIX = "negora:offline-cache:";

/** Descarta lo cacheado pasado este tiempo, para no revivir menús de hace meses. */
export const OFFLINE_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEnvelope<T> {
  savedAt: number;
  data: T;
}

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    // Safari en modo privado y algunos WebView lanzan al tocar localStorage.
    return null;
  }
}

/**
 * Guarda un valor. Nunca lanza: fallar al cachear no puede romper la operación
 * que lo originó (cuota llena, modo privado, almacenamiento deshabilitado).
 */
export function writeOfflineCache<T>(key: string, data: T): void {
  const store = storage();
  if (!store) return;
  try {
    const envelope: CacheEnvelope<T> = { savedAt: Date.now(), data };
    store.setItem(`${PREFIX}${key}`, JSON.stringify(envelope));
  } catch {
    // Sin espacio o sin permiso: se sigue sin caché offline.
  }
}

/**
 * Lee un valor cacheado, o `undefined` si no hay, está caducado o corrupto.
 *
 * Devuelve `undefined` y no `null` a propósito: es lo que React Query espera
 * en `initialData` para entender "no hay dato inicial".
 */
export function readOfflineCache<T>(
  key: string,
  maxAgeMs: number = OFFLINE_CACHE_MAX_AGE_MS,
): T | undefined {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(`${PREFIX}${key}`);
    if (!raw) return undefined;

    const envelope = JSON.parse(raw) as CacheEnvelope<T>;
    if (typeof envelope?.savedAt !== "number") {
      store.removeItem(`${PREFIX}${key}`);
      return undefined;
    }

    const age = Date.now() - envelope.savedAt;
    // Solo se BORRA al superar el límite absoluto. Una caducidad más corta
    // pedida por quien llama es una preferencia suya —"esto ya no me sirve"—,
    // y borrar por ella tiraría un dato que otro llamador con una ventana más
    // amplia sí habría aceptado.
    if (age > OFFLINE_CACHE_MAX_AGE_MS) {
      store.removeItem(`${PREFIX}${key}`);
      return undefined;
    }
    if (age > maxAgeMs) return undefined;

    return envelope.data;
  } catch {
    // JSON corrupto: se trata como si no hubiera caché.
    return undefined;
  }
}

/** Momento en que se guardó una entrada, para poder avisar de su antigüedad. */
export function offlineCacheSavedAt(key: string): Date | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CacheEnvelope<unknown>;
    return typeof envelope?.savedAt === "number"
      ? new Date(envelope.savedAt)
      : null;
  } catch {
    return null;
  }
}

/**
 * Borra todo lo cacheado. Se llama al cerrar sesión: los menús dependen del rol
 * y de los permisos del usuario, así que no deben sobrevivir a un cambio de
 * cuenta en el mismo dispositivo.
 */
export function clearOfflineCache(): void {
  const store = storage();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    // Nada que hacer: la caché caducará sola.
  }
}

/** Claves usadas. Centralizadas para que no se dupliquen por error. */
export const OFFLINE_CACHE_KEYS = {
  navigationSections: (businessId: string | null) =>
    `navigation-sections:${businessId ?? "none"}`,
} as const;
