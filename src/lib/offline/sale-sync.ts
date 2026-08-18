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
export async function createSaleOrQueue(
  credentials: CreateSaleProps,
): Promise<CreateSaleResult> {
  const operationId = newOperationId();
  const payload = buildCreateSalePayload(credentials);

  try {
    const sale = await postCreateSale(payload, operationId);
    return { queued: false, sale };
  } catch (error) {
    // Un 422 (sin stock) o un 403 (plan vencido) son respuestas del servidor:
    // encolarlas sería prometer que la venta se subirá cuando ya se sabe que
    // será rechazada. Solo se encola cuando no hubo respuesta.
    if (!isNetworkError(error)) throw error;

    const owner = currentQueueOwner();
    if (!owner) throw error;

    const operation = await enqueueOperation({
      id: operationId,
      type: "sale.create",
      businessId: credentials.idbusiness,
      userId: owner,
      payload,
      label: describeSaleOperation(payload),
      // Si el navegador ya sabía que estaba sin red, la petición no llegó a
      // salir y no hay ninguna duda que resolver.
      needsManualCheck:
        typeof navigator !== "undefined" && navigator.onLine !== false,
    });

    return { queued: true, operation };
  }
}
