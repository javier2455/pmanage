/**
 * Tipos de la cola de operaciones (plan offline, B6).
 *
 * Van en su propio módulo, sin importar Dexie, para que la lógica pura y sus
 * pruebas puedan usarlos sin arrastrar IndexedDB al entorno de test.
 */

/**
 * Operaciones que el servidor sabe reproducir. Debe coincidir con
 * `SYNC_OPERATION_TYPES` del backend: encolar un tipo que allí no existe sería
 * prometerle al usuario que su trabajo se subirá cuando en realidad se
 * rechazará entero.
 */
export const OUTBOX_OPERATION_TYPES = ["sale.create"] as const;
export type OutboxOperationType = (typeof OUTBOX_OPERATION_TYPES)[number];

/**
 * Estados de una operación encolada.
 *
 * - `pending`: esperando turno. Es el estado normal sin conexión.
 * - `inflight`: se está subiendo ahora mismo. Nunca se edita ni se descarta.
 * - `done`: aplicada en el servidor. Se conserva un tiempo como historial.
 * - `failed`: el servidor la rechazó por algo transitorio; se reintentará.
 * - `rejected`: el servidor la rechazó por algo que no cambia solo (sin stock,
 *   datos inválidos). Espera una decisión de la persona.
 *
 * El plan contempla además `blocked` y `discarded`, que llegan con el grafo de
 * dependencias y la edición de la cola. Hoy la única operación encolable es la
 * venta, y una venta no depende de otra operación de la cola.
 */
export type OutboxStatus =
  | "pending"
  | "inflight"
  | "done"
  | "failed"
  | "rejected";

/** Último fallo conocido, tal como lo contó el servidor. */
export interface OutboxError {
  at: number;
  /** Código estable del backend (`SYNC_*`, `IDEMPOTENCY_*`) si lo hubo. */
  code: string | null;
  /** Mensaje literal del servidor: es lo que se le enseña a la persona. */
  message: string;
  status: number | null;
}

export interface OutboxOp {
  /**
   * Autoincremental de Dexie. Es el orden FIFO real de la cola: el orden en
   * que ocurrieron las cosas, que es el único orden correcto para reproducirlas.
   */
  seq?: number;
  /**
   * UUID generado en el dispositivo. Viaja como `clientOperationId` al
   * sincronizar y como `Idempotency-Key` cuando la operación se intenta en
   * línea, de modo que ambas vías comparten la misma entrada del registro del
   * servidor y no pueden duplicar el efecto.
   */
  id: string;
  businessId: string;
  /**
   * Quién la creó. La cola sobrevive al cierre de sesión (contiene trabajo sin
   * subir), así que hay que poder distinguir de quién es cada operación antes
   * de subirla con la sesión de otra persona.
   */
  userId: string;
  type: OutboxOperationType;
  /** Cuerpo exacto que espera el endpoint en línea, ya normalizado. */
  payload: Record<string, unknown>;
  /** Cuándo ocurrió de verdad, no cuándo se logró subir. */
  occurredAt: string;
  createdAt: number;
  updatedAt: number;
  status: OutboxStatus;
  /** Intentos con respuesta del servidor. Un fallo de red no cuenta. */
  attempts: number;
  /** Cuándo puede reintentarse; null si no hay espera. */
  nextAttemptAt: number | null;
  /**
   * La operación se intentó en línea y la respuesta se perdió: pudo haberse
   * aplicado. Hoy lo resuelve el propio servidor gracias a la clave de
   * idempotencia compartida; el campo se conserva porque el diagnóstico sigue
   * siendo útil para explicar qué pasó.
   */
  needsManualCheck: boolean;
  lastError: OutboxError | null;
  /** Texto para la interfaz: "Venta · 3 productos · 1 250,00 CUP". */
  label: string;
  /**
   * Versión del formato de `payload`. Si el DTO del backend cambia, una
   * operación guardada con el formato viejo se detecta en vez de subirse y ser
   * rechazada sin explicación.
   */
  schemaVersion: number;
}

/** Formato actual de los payloads encolados. */
export const OUTBOX_SCHEMA_VERSION = 1;

/** Resumen de la cola para la interfaz. */
export interface OutboxCounts {
  pending: number;
  failed: number;
  rejected: number;
  inflight: number;
  /** Lo que le importa a la persona: cuánto trabajo suyo no está en el servidor. */
  unsynced: number;
}
