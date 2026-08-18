import { pushOperations, type SyncPushOperation } from "@/lib/api/sync";
import {
  chunkOperations,
  classifyPushFailure,
  outcomeForMissingResult,
  resolveOperationOutcome,
  transportError,
  type TransportVerdict,
} from "./outbox-policy";
import {
  applyOutcome,
  listDueOperations,
  markInflight,
  pruneDoneOperations,
  releaseInflight,
} from "./outbox";
import type { OutboxOp } from "./outbox-types";
import { randomUuid } from "./uuid";

/**
 * Sube la cola al servidor (plan offline, B6).
 *
 * Tres reglas gobiernan esta máquina:
 *
 * 1. **Un solo envío a la vez, en todo el navegador.** Dos pestañas subiendo
 *    la misma cola mandarían cada operación dos veces. Lo impide un cerrojo
 *    entre pestañas; sin él, la idempotencia del servidor salvaría los datos,
 *    pero el usuario vería errores confusos y la mitad del trabajo duplicado
 *    en la lista de pendientes.
 * 2. **Nada se borra al subir.** Una operación aplicada pasa a `done` y se
 *    conserva un tiempo como historial. Si alguien pregunta "¿se subió mi
 *    venta de ayer?", tiene que haber una respuesta.
 * 3. **Un fallo de transporte devuelve las operaciones a la cola intactas.**
 *    Solo cuentan como intento las que el servidor llegó a juzgar.
 */

export interface SyncRunResult {
  /** false cuando otra pestaña tenía el turno: no es un error. */
  ran: boolean;
  applied: number;
  /** Aplicadas que el servidor ya tenía registradas de un intento anterior. */
  duplicated: number;
  failed: number;
  rejected: number;
  /** Operaciones que se quedaron sin enviar en esta pasada. */
  remaining: number;
  /** Motivo por el que se detuvo la subida, si se detuvo. */
  stoppedBy: TransportVerdict | null;
}

const EMPTY_RESULT: SyncRunResult = {
  ran: true,
  applied: 0,
  duplicated: 0,
  failed: 0,
  rejected: 0,
  remaining: 0,
  stoppedBy: null,
};

const SYNC_LOCK_NAME = "negora-sync";

/** Evita dos subidas simultáneas dentro de esta misma pestaña. */
let localRunInProgress = false;

export async function runSync(params: {
  businessId: string;
  userId: string;
}): Promise<SyncRunResult> {
  if (localRunInProgress) return { ...EMPTY_RESULT, ran: false };
  localRunInProgress = true;
  try {
    return await withCrossTabLock(() => pushQueue(params));
  } finally {
    localRunInProgress = false;
  }
}

/**
 * Cerrojo entre pestañas. `ifAvailable` hace que, si otra pestaña ya está
 * subiendo, esta se retire en vez de esperar: cuando la otra termine ya no
 * quedará nada que subir.
 *
 * Sin `navigator.locks` (Safari antiguo) se sigue adelante con el cerrojo de
 * pestaña únicamente. Es el peor caso y está cubierto por la idempotencia del
 * servidor, que es justamente para lo que se construyó.
 */
async function withCrossTabLock(
  run: () => Promise<SyncRunResult>,
): Promise<SyncRunResult> {
  if (typeof navigator === "undefined" || !navigator.locks) return run();

  const result = await navigator.locks.request(
    SYNC_LOCK_NAME,
    { ifAvailable: true },
    async (lock) => (lock ? run() : null),
  );
  return result ?? { ...EMPTY_RESULT, ran: false };
}

async function pushQueue(params: {
  businessId: string;
  userId: string;
}): Promise<SyncRunResult> {
  const due = await listDueOperations(params);
  if (due.length === 0) return EMPTY_RESULT;

  const chunks = chunkOperations(due);
  const tally = { ...EMPTY_RESULT };
  let sent = 0;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const seqs = chunk
      .map((op) => op.seq)
      .filter((seq): seq is number => typeof seq === "number");

    await markInflight(seqs);

    try {
      const response = await pushOperations({
        businessId: params.businessId,
        batchId: randomUuid(),
        clientSentAt: new Date().toISOString(),
        chunkIndex: index,
        chunkTotal: chunks.length,
        operations: chunk.map(toWire),
      });

      const byId = new Map(
        response.results.map((result) => [result.clientOperationId, result]),
      );
      const now = Date.now();

      for (const op of chunk) {
        const result = byId.get(op.id);
        const outcome = result
          ? resolveOperationOutcome(op, result, now)
          : outcomeForMissingResult(op, now);

        if (typeof op.seq === "number") await applyOutcome(op.seq, outcome);

        if (outcome.status === "done") {
          tally.applied += 1;
          if (result?.duplicate) tally.duplicated += 1;
        } else if (outcome.status === "rejected") {
          tally.rejected += 1;
        } else {
          tally.failed += 1;
        }
      }
      sent += chunk.length;
    } catch (error) {
      const verdict = classifyPushFailure(error);
      const failure = transportError(error, verdict.message, Date.now());

      if (verdict.kind === "reject") {
        // El servidor rechazó la forma del envío. Reintentar daría lo mismo,
        // así que las operaciones quedan marcadas para que se vean en la lista
        // en vez de girar en el vacío.
        for (const op of chunk) {
          if (typeof op.seq !== "number") continue;
          await applyOutcome(op.seq, {
            status: "rejected",
            attempts: op.attempts + 1,
            nextAttemptAt: null,
            lastError: failure,
            needsManualCheck: false,
            entityId: null,
          });
        }
        tally.rejected += chunk.length;
        sent += chunk.length;
      } else {
        await releaseInflight(seqs, failure);
      }

      return { ...tally, remaining: due.length - sent, stoppedBy: verdict };
    }
  }

  // Solo se purga tras una pasada completa: si la subida se cortó, el
  // historial es justo lo que hace falta para explicar qué pasó.
  await pruneDoneOperations();
  return { ...tally, remaining: due.length - sent, stoppedBy: null };
}

function toWire(op: OutboxOp): SyncPushOperation {
  return {
    clientOperationId: op.id,
    // El orden local viaja al servidor: es el orden en que ocurrieron las
    // cosas, y el servidor las reproduce en él.
    seq: op.seq ?? 0,
    type: op.type,
    occurredAt: op.occurredAt,
    payload: op.payload,
  };
}
