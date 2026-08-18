import { offlineDb } from "@/lib/db/offline-db";
import {
  OUTBOX_SCHEMA_VERSION,
  type OutboxCounts,
  type OutboxError,
  type OutboxOp,
  type OutboxOperationType,
} from "./outbox-types";
import { countOutbox, isDue, type OperationOutcome } from "./outbox-policy";
import { randomUuid } from "./uuid";

/**
 * Persistencia de la cola de operaciones (plan offline, B6).
 *
 * Este módulo solo guarda y recupera; no decide nada. Las decisiones —cuándo
 * reintentar, cuándo rendirse— están en `outbox-policy`, que es puro y está
 * probado aparte.
 *
 * Regla que atraviesa todo el archivo: **una operación encolada es trabajo de
 * una persona que ya dio por hecho.** Nunca se borra sola, nunca se pierde en
 * silencio y cualquier fallo al guardarla tiene que llegar hasta la interfaz.
 */

/** Historial de operaciones ya subidas que se conserva antes de purgarlo. */
export const DONE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Tiempo máximo esperando a la base local.
 *
 * IndexedDB puede quedarse esperando indefinidamente —una pestaña antigua
 * bloqueando una actualización de esquema, el navegador sin permiso de
 * almacenamiento— y sin este corte el botón de registrar se queda girando para
 * siempre. Es preferible un error claro: al menos la persona sabe que tiene
 * que apuntar la venta.
 */
export const OUTBOX_OPEN_TIMEOUT_MS = 8_000;

/** La base local no está disponible (modo privado, sin IndexedDB, SSR). */
export class OutboxUnavailableError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "No se puede guardar en este dispositivo: el navegador no permite " +
          "almacenamiento local.",
    );
    this.name = "OutboxUnavailableError";
  }
}

function requireDb() {
  const db = offlineDb();
  // Encolar es la promesa de "no se pierde una venta". Si no hay dónde
  // guardarla, hay que decirlo alto: fallar aquí es infinitamente mejor que
  // devolver un identificador falso y que la venta se evapore al recargar.
  if (!db) throw new OutboxUnavailableError();
  return db;
}

/** Identificador de la operación; es también su clave de idempotencia. */
export function newOperationId(): string {
  return randomUuid();
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new OutboxUnavailableError(message)), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export interface EnqueueInput {
  type: OutboxOperationType;
  businessId: string;
  userId: string;
  payload: Record<string, unknown>;
  label: string;
  /** Se reutiliza el id del intento en línea para compartir idempotencia. */
  id?: string;
  occurredAt?: Date;
  /** Se intentó en línea y la respuesta se perdió. */
  needsManualCheck?: boolean;
  lastError?: OutboxError | null;
}

export async function enqueueOperation(input: EnqueueInput): Promise<OutboxOp> {
  const db = requireDb();

  // Se abre la base ANTES de construir nada. Si la apertura se atasca, el
  // corte salta sin haber escrito una sola fila: el error es entonces
  // inequívoco —la venta no se guardó— en vez de dejar la duda de si quedó a
  // medias.
  await withTimeout(
    db.open(),
    OUTBOX_OPEN_TIMEOUT_MS,
    "La base local del dispositivo no responde. Si tienes Negora abierto en " +
      "otra pestaña, ciérrala y vuelve a intentarlo.",
  );

  const now = Date.now();
  const op: OutboxOp = {
    id: input.id ?? newOperationId(),
    type: input.type,
    businessId: input.businessId,
    userId: input.userId,
    payload: input.payload,
    label: input.label,
    occurredAt: (input.occurredAt ?? new Date(now)).toISOString(),
    createdAt: now,
    updatedAt: now,
    status: "pending",
    attempts: 0,
    nextAttemptAt: null,
    needsManualCheck: input.needsManualCheck ?? false,
    lastError: input.lastError ?? null,
    schemaVersion: OUTBOX_SCHEMA_VERSION,
  };

  const seq = await db.outbox.add(op);
  return { ...op, seq };
}

/** Toda la cola de un negocio, en el orden en que ocurrió. */
export async function listOutbox(businessId?: string): Promise<OutboxOp[]> {
  const db = offlineDb();
  if (!db) return [];
  const rows = businessId
    ? await db.outbox.where("businessId").equals(businessId).toArray()
    : await db.outbox.toArray();
  return rows.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

/**
 * Operaciones listas para subir.
 *
 * Se filtra por persona además de por negocio: la cola sobrevive al cierre de
 * sesión —contiene trabajo sin subir—, así que en un dispositivo compartido
 * las ventas de quien salió no pueden subirse con la sesión de quien entró.
 * Esperan a que su dueño vuelva.
 */
export async function listDueOperations(params: {
  businessId: string;
  userId: string;
  now?: number;
}): Promise<OutboxOp[]> {
  const now = params.now ?? Date.now();
  const all = await listOutbox(params.businessId);
  return all.filter((op) => op.userId === params.userId && isDue(op, now));
}

/** Marca un envío en curso para que nadie más lo tome. */
export async function markInflight(seqs: number[]): Promise<void> {
  const db = requireDb();
  const now = Date.now();
  await db.outbox
    .where("seq")
    .anyOf(seqs)
    .modify({ status: "inflight", updatedAt: now });
}

/** Guarda el veredicto del servidor para una operación. */
export async function applyOutcome(
  seq: number,
  outcome: OperationOutcome,
): Promise<void> {
  const db = requireDb();
  await db.outbox.update(seq, {
    status: outcome.status,
    attempts: outcome.attempts,
    nextAttemptAt: outcome.nextAttemptAt,
    lastError: outcome.lastError,
    needsManualCheck: outcome.needsManualCheck,
    updatedAt: Date.now(),
  });
}

/**
 * Devuelve a la cola operaciones que se estaban enviando cuando el envío se
 * cortó. Sin esto quedarían en `inflight`, que no se reintenta nunca: el
 * trabajo seguiría en el dispositivo pero ya no se subiría jamás.
 */
export async function releaseInflight(
  seqs: number[],
  lastError: OutboxError | null,
): Promise<void> {
  const db = requireDb();
  const now = Date.now();
  await db.outbox
    .where("seq")
    .anyOf(seqs)
    .modify((op) => {
      if (op.status !== "inflight") return;
      op.status = "pending";
      op.updatedAt = now;
      // El intento NO se cuenta: la operación no llegó a ser juzgada por el
      // servidor, así que no dice nada sobre si es válida.
      if (lastError) op.lastError = lastError;
    });
}

/**
 * Rescata operaciones que quedaron en `inflight` de una sesión anterior
 * (pestaña cerrada a media subida, batería agotada). Se llama al arrancar.
 */
export async function recoverStaleInflight(): Promise<number> {
  const db = offlineDb();
  if (!db) return 0;
  const stale = await db.outbox.where("status").equals("inflight").toArray();
  if (stale.length === 0) return 0;
  await releaseInflight(
    stale.map((op) => op.seq).filter((s): s is number => typeof s === "number"),
    null,
  );
  return stale.length;
}

/** Vuelve a poner una operación en cola inmediatamente, sin esperar la espera. */
export async function retryNow(seq: number): Promise<void> {
  const db = requireDb();
  await db.outbox.update(seq, {
    status: "pending",
    nextAttemptAt: null,
    updatedAt: Date.now(),
  });
}

/**
 * Descarta una operación. Solo la persona puede pedirlo, y solo si no se está
 * enviando: descartar algo en vuelo dejaría el servidor y el dispositivo
 * contando historias distintas.
 */
export async function discardOperation(seq: number): Promise<boolean> {
  const db = requireDb();
  const op = await db.outbox.get(seq);
  if (!op || op.status === "inflight") return false;
  await db.outbox.delete(seq);
  return true;
}

export async function outboxCounts(businessId: string): Promise<OutboxCounts> {
  return countOutbox(await listOutbox(businessId));
}

/**
 * Limpia el historial de operaciones ya subidas. Solo toca `done`: lo demás es
 * trabajo que aún no está en el servidor.
 */
export async function pruneDoneOperations(now = Date.now()): Promise<number> {
  const db = offlineDb();
  if (!db) return 0;
  const cutoff = now - DONE_RETENTION_MS;
  return db.outbox
    .where("status")
    .equals("done")
    .filter((op) => op.updatedAt < cutoff)
    .delete();
}
