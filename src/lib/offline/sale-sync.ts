import { buildCreateSalePayload, postCreateSale } from "@/lib/api/sale";
import { isNetworkError } from "@/lib/http-error";
import type { BusinessWithProducts } from "@/lib/types/business";
import type { CreateSaleProps } from "@/lib/types/sales";
import { enqueueOperation, newOperationId } from "./outbox";
import { describeSaleOperation } from "./outbox-policy";
import type { OutboxOp } from "./outbox-types";
import { currentQueueOwner } from "./queue-owner";

export type CreateSaleResult =
  | { queued: false; sale: BusinessWithProducts }
  | { queued: true; operation: OutboxOp };

/**
 * Registra una venta: al servidor si se puede, a la cola local si no
 * (plan offline, B6).
 *
 * **Se intenta la red siempre, sin preguntar antes si hay conexión.** Podría
 * consultarse el estado de conectividad y saltarse el intento, pero ese estado
 * llega con retraso: entre el último sondeo y este momento la red pudo caer o
 * volver. Sin conexión el navegador falla al instante, así que el intento no
 * cuesta nada, y a cambio nunca se encola una venta que podía haberse subido.
 *
 * El caso incómodo —la petición salió, el servidor la registró y la respuesta
 * se perdió— lo resuelve la clave de idempotencia: la venta se encola con el
 * MISMO identificador que llevaba la petición, así que al subir la cola el
 * servidor reconoce la operación y devuelve la venta que ya creó en vez de
 * crear otra.
 */
/**
 * Tope absoluto de la operación completa.
 *
 * Cada paso tiene ya su propio corte —la petición, la base local—, así que esto
 * no debería saltar nunca. Está porque el fallo que produce es intolerable: un
 * botón «Registrando…» girando indefinidamente delante de un cliente que
 * espera, sin decir qué pasó ni permitir reintentar. Ante la duda, un error a
 * los 25 segundos es infinitamente mejor que un giro eterno.
 */
export const CREATE_SALE_DEADLINE_MS = 25_000;

export async function createSaleOrQueue(
  credentials: CreateSaleProps,
): Promise<CreateSaleResult> {
  return withDeadline(
    createSaleOrQueueInner(credentials),
    CREATE_SALE_DEADLINE_MS,
  );
}

async function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "La venta tardó demasiado y se canceló. Comprueba en " +
                  "«Cambios sin subir» y en la lista de ventas antes de " +
                  "volver a registrarla.",
              ),
            ),
          ms,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function createSaleOrQueueInner(
  credentials: CreateSaleProps,
): Promise<CreateSaleResult> {
  const operationId = newOperationId();
  const payload = buildCreateSalePayload(credentials);

  const queue = (needsManualCheck: boolean) =>
    enqueueSale(operationId, payload, credentials.idbusiness, needsManualCheck);

  // `navigator.onLine === false` es la única dirección fiable de esa señal:
  // afirma que no hay ni WiFi ni datos, así que la petición no puede llegar a
  // ninguna parte. Saltársela ahorra los segundos de espera del tiempo límite
  // delante de quien está esperando su vuelto.
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { queued: true, operation: await queue(false) };
  }

  try {
    const sale = await postCreateSale(payload, operationId);
    return { queued: false, sale };
  } catch (error) {
    // Un 422 (sin stock) o un 403 (plan vencido) son respuestas del servidor:
    // encolarlas sería prometer que la venta se subirá cuando ya se sabe que
    // será rechazada. Solo se encola cuando no hubo respuesta.
    if (!isNetworkError(error)) throw error;
    if (!currentQueueOwner()) throw error;

    // La petición llegó a salir: pudo haberse aplicado. Lo resuelve la clave de
    // idempotencia al subir la cola, pero queda anotado para poder explicarlo.
    return { queued: true, operation: await queue(true) };
  }
}

async function enqueueSale(
  operationId: string,
  payload: Record<string, unknown>,
  businessId: string,
  needsManualCheck: boolean,
): Promise<OutboxOp> {
  const owner = currentQueueOwner();
  if (!owner) {
    throw new Error(
      "No se puede guardar la venta: no hay una sesión que la respalde.",
    );
  }

  return enqueueOperation({
    id: operationId,
    type: "sale.create",
    businessId,
    userId: owner,
    payload,
    label: describeSaleOperation(payload),
    needsManualCheck,
  });
}
