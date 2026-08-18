import Dexie, { type Table } from "dexie";
import type { OutboxOp } from "@/lib/offline/outbox-types";

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
  outbox!: Table<OutboxOp, number>;

  constructor() {
    super("negora-offline");
    // `key` es la clave primaria; `savedAt` y `businessId` se indexan para
    // poder purgar por antigüedad y por negocio sin recorrer toda la tabla.
    this.version(1).stores({
      readCache: "key, savedAt, businessId",
    });
    // v2: cola de operaciones (plan offline, B6).
    //
    // `++seq` autoincremental como clave primaria porque el orden de inserción
    // ES el orden en que ocurrieron las cosas, y ese es el único orden en que
    // se pueden reproducir. `&id` es único: el UUID del cliente viaja al
    // servidor como clave de idempotencia, y dos filas con el mismo UUID
    // significarían dos intentos de aplicar el mismo efecto.
    this.version(2).stores({
      outbox: "++seq, &id, status, businessId, [businessId+status], createdAt",
    });

    // Otra pestaña con la versión anterior del esquema abierta bloquea la
    // actualización INDEFINIDAMENTE, y con ella cualquier lectura o escritura:
    // el síntoma es un botón «Registrando…» que gira para siempre. Cerrando
    // esta conexión cuando otra pestaña pide subir de versión, la
    // actualización pasa; Dexie vuelve a abrir sola en la siguiente operación.
    this.on("versionchange", () => {
      this.close();
    });
    this.on("blocked", () => {
      console.warn(
        "[offline] La base local no puede actualizarse: hay otra pestaña de " +
          "Negora abierta con una versión anterior. Ciérrala y recarga.",
      );
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
