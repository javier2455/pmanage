import Dexie, { type Table } from "dexie";

/**
 * Base de datos local del navegador (plan offline, B2).
 *
 * IndexedDB —vía Dexie— y no `localStorage` por tres razones que importan aquí:
 * es asíncrona (no bloquea la interfaz al guardar una lista de mil productos),
 * admite decenas de MB en vez de ~5, y guarda objetos sin serializar a mano.
 *
 * `localStorage` se sigue usando para el árbol de navegación
 * (`@/lib/offline-cache`): es diminuto y hace falta leerlo de forma síncrona
 * para pintar el sidebar sin parpadeo.
 */

/** Una respuesta de lectura guardada para poder mostrarla sin conexión. */
export interface ReadCacheRow {
  /** Clave estable de la consulta; ver `readCacheKey`. */
  key: string;
  /** Momento en que se guardó, para poder avisar de la antigüedad del dato. */
  savedAt: number;
  /** Negocio al que pertenece, para poder limpiar al cambiar de negocio. */
  businessId: string | null;
  data: unknown;
}

class NegoraOfflineDB extends Dexie {
  readCache!: Table<ReadCacheRow, string>;

  constructor() {
    super("negora-offline");
    // `key` es la clave primaria; `savedAt` y `businessId` se indexan para
    // poder purgar por antigüedad y por negocio sin recorrer toda la tabla.
    this.version(1).stores({
      readCache: "key, savedAt, businessId",
    });
  }
}

/**
 * Instancia única. Se crea de forma perezosa porque en el build estático este
 * módulo también se evalúa en Node, donde no existe IndexedDB y construir la
 * base lanzaría.
 */
let instance: NegoraOfflineDB | null = null;

export function offlineDb(): NegoraOfflineDB | null {
  if (typeof indexedDB === "undefined") return null;
  instance ??= new NegoraOfflineDB();
  return instance;
}

/**
 * Clave estable de una consulta cacheada.
 *
 * Incluye siempre el negocio: dos negocios del mismo usuario tienen productos,
 * ventas y saldos distintos, y servir los de uno en el otro sería peor que no
 * tener caché.
 */
export function readCacheKey(
  name: string,
  businessId: string | null,
  extra?: string,
): string {
  return [name, businessId ?? "none", extra].filter(Boolean).join(":");
}
