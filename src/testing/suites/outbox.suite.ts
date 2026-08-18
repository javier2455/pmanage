import { defineSuite, expect } from "../harness";
import {
  MAX_ATTEMPTS,
  RETRY_BASE_MS,
  RETRY_MAX_MS,
  chunkOperations,
  classifyPushFailure,
  countOutbox,
  describeSaleOperation,
  isDue,
  isRetryableOperationCode,
  outcomeForMissingResult,
  resolveOperationOutcome,
  retryDelayMs,
} from "@/lib/offline/outbox-policy";
import type { OutboxOp, OutboxStatus } from "@/lib/offline/outbox-types";

const NOW = 1_700_000_000_000;

function op(overrides: Partial<OutboxOp> = {}): OutboxOp {
  return {
    id: "op-1",
    businessId: "biz-1",
    userId: "user-1",
    type: "sale.create",
    payload: {},
    occurredAt: new Date(NOW).toISOString(),
    createdAt: NOW,
    updatedAt: NOW,
    status: "pending",
    attempts: 0,
    nextAttemptAt: null,
    needsManualCheck: false,
    lastError: null,
    label: "Venta",
    schemaVersion: 1,
    ...overrides,
  };
}

const axiosError = (status: number, data?: unknown) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  });

const networkError = () =>
  Object.assign(new Error("Network Error"), {
    isAxiosError: true,
    response: undefined,
  });

export const outboxSuite = defineSuite(
  "Cola de operaciones (offline)",
  ({ test }) => {
    /* ------------------------------------------------------- reintentos */

    test(
      "la espera entre intentos crece pero tiene techo",
      () => {
        expect(retryDelayMs(1)).toBe(RETRY_BASE_MS);
        expect(retryDelayMs(2)).toBe(RETRY_BASE_MS * 2);
        expect(retryDelayMs(3)).toBe(RETRY_BASE_MS * 4);
        expect(retryDelayMs(50)).toBe(RETRY_MAX_MS);
      },
      "Sin techo, tras unos pocos fallos la siguiente subida caería dentro " +
        "de varios días y el trabajo se quedaría en el dispositivo para " +
        "siempre.",
    );

    test(
      "una operación pendiente siempre toca subirla",
      () => {
        expect(isDue(op({ status: "pending" }), NOW)).toBe(true);
      },
    );

    test(
      "una fallida espera a que venza su turno",
      () => {
        const failed = op({ status: "failed", nextAttemptAt: NOW + 60_000 });
        expect(isDue(failed, NOW)).toBe(false);
        expect(isDue(failed, NOW + 60_000)).toBe(true);
      },
      "Reintentar antes de tiempo repite el mismo fallo y gasta intentos.",
    );

    test(
      "lo que se está enviando o ya se rechazó no se toca",
      () => {
        expect(isDue(op({ status: "inflight" }), NOW)).toBe(false);
        expect(isDue(op({ status: "rejected" }), NOW)).toBe(false);
        expect(isDue(op({ status: "done" }), NOW)).toBe(false);
      },
      "`inflight` se está subiendo ahora; `rejected` espera una decisión de " +
        "la persona y volver a mandarla sola daría el mismo rechazo.",
    );

    test(
      "la cola se parte en envíos del tamaño que admite el servidor",
      () => {
        const ops = Array.from({ length: 5 }, (_, i) => i);
        expect(chunkOperations(ops, 2)).toEqual([[0, 1], [2, 3], [4]]);
        expect(chunkOperations([], 2)).toEqual([]);
      },
      "Un dispositivo que estuvo tres días sin red puede llevar cientos de " +
        "ventas; el backend rechaza el lote entero si pasa de 200.",
    );

    /* ------------------------------------------- fallo de todo el envío */

    test(
      "sin red el envío se reintenta y nada se marca",
      () => {
        const verdict = classifyPushFailure(networkError());
        expect(verdict.kind).toBe("retry");
        expect(verdict.reason).toBe("network");
      },
      "La operación no llegó a salir: no dice nada sobre si es válida.",
    );

    test(
      "un 401 detiene la cola en vez de reintentar",
      () => {
        const verdict = classifyPushFailure(axiosError(401));
        expect(verdict.kind).toBe("pause");
        expect(verdict.reason).toBe("session");
      },
      "Reintentar con la sesión caducada solo consume intentos. Hay que " +
        "decirle a la persona que vuelva a entrar, dejando el trabajo intacto.",
    );

    test(
      "un 403 detiene la cola y usa el mensaje del servidor",
      () => {
        const verdict = classifyPushFailure(
          axiosError(403, { mensaje: "El plan del negocio venció." }),
        );
        expect(verdict.kind).toBe("pause");
        expect(verdict.message).toBe("El plan del negocio venció.");
      },
      "«El plan del negocio venció» se puede resolver; «error 403» no.",
    );

    test(
      "un 429 o un 500 se reintentan solos",
      () => {
        expect(classifyPushFailure(axiosError(429)).kind).toBe("retry");
        expect(classifyPushFailure(axiosError(503)).kind).toBe("retry");
      },
    );

    test(
      "un 400 se marca en vez de reintentarse para siempre",
      () => {
        const verdict = classifyPushFailure(axiosError(400));
        expect(verdict.kind).toBe("reject");
      },
      "El servidor rechazó la FORMA del envío: reintentar daría siempre lo " +
        "mismo. Marcarlo lo hace visible en vez de girar en el vacío.",
    );

    /* ------------------------------------------ fallo de una operación */

    test(
      "una operación aplicada queda cerrada y sin dudas",
      () => {
        const outcome = resolveOperationOutcome(
          op({ attempts: 2 }),
          { clientOperationId: "op-1", status: "applied", entityId: "sale-9" },
          NOW,
        );
        expect(outcome.status).toBe("done");
        expect(outcome.entityId).toBe("sale-9");
        expect(outcome.needsManualCheck).toBe(false);
        expect(outcome.lastError).toBe(null);
      },
      "Que el servidor la reconozca resuelve también la duda de si la " +
        "petición en línea había llegado.",
    );

    test(
      "«se está procesando» se reintenta, no se rechaza",
      () => {
        expect(isRetryableOperationCode("IDEMPOTENCY_IN_PROGRESS")).toBe(true);
        const outcome = resolveOperationOutcome(
          op(),
          {
            clientOperationId: "op-1",
            status: "failed",
            error: {
              code: "IDEMPOTENCY_IN_PROGRESS",
              message: "En proceso.",
            },
          },
          NOW,
        );
        expect(outcome.status).toBe("failed");
        expect(outcome.nextAttemptAt).toBe(NOW + RETRY_BASE_MS);
      },
      "Significa que el servidor está aplicando ESTA misma venta ahora. " +
        "Darla por rechazada haría que se registrara otra vez: duplicado.",
    );

    test(
      "una venta sin stock se rechaza y espera una decisión",
      () => {
        const outcome = resolveOperationOutcome(
          op(),
          {
            clientOperationId: "op-1",
            status: "failed",
            error: { code: "422", message: "No hay stock de «Café»." },
          },
          NOW,
        );
        expect(outcome.status).toBe("rejected");
        expect(outcome.nextAttemptAt).toBe(null);
        expect(outcome.lastError?.message).toBe("No hay stock de «Café».");
      },
      "El stock no vuelve solo: reintentar sin que nadie haga nada solo " +
        "repite el error y esconde el problema.",
    );

    test(
      "un fallo del servidor se reintenta hasta un límite",
      () => {
        const result = {
          clientOperationId: "op-1",
          status: "failed" as const,
          error: { code: "500", message: "Fallo interno." },
        };
        expect(resolveOperationOutcome(op({ attempts: 0 }), result, NOW).status).toBe(
          "failed",
        );
        expect(
          resolveOperationOutcome(op({ attempts: MAX_ATTEMPTS - 1 }), result, NOW)
            .status,
        ).toBe("rejected");
      },
      "Un fallo que se repite seis veces ya no es transitorio: hay que " +
        "enseñarlo en vez de seguir escondiéndolo tras un reintento.",
    );

    test(
      "una operación sin respuesta vuelve a la cola marcada para revisar",
      () => {
        const outcome = outcomeForMissingResult(op(), NOW);
        expect(outcome.status).toBe("failed");
        expect(outcome.needsManualCheck).toBe(true);
      },
      "Dejarla en `inflight` sería peor: ese estado no se reintenta nunca y " +
        "el trabajo se quedaría en el dispositivo sin que nadie lo mire.",
    );

    /* ---------------------------------------------- etiquetas y resumen */

    test(
      "la etiqueta describe la venta con su total",
      () => {
        const label = describeSaleOperation({
          currency: "cup_transferencia",
          items: [
            { quantity: 2, price: 100 },
            { quantity: 1, price: 50 },
          ],
        });
        expect(label).toContain("2 productos");
        expect(label).toContain("250.00");
      },
      "Sin conexión no hay forma de mirar la venta en el servidor: la " +
        "etiqueta es lo único que permite reconocerla en la lista.",
    );

    test(
      "el contador principal suma TODO lo que no está en el servidor",
      () => {
        const statuses: OutboxStatus[] = [
          "pending",
          "pending",
          "failed",
          "rejected",
          "done",
        ];
        const counts = countOutbox(statuses.map((status) => ({ status })));
        expect(counts.pending).toBe(2);
        expect(counts.unsynced).toBe(4);
      },
      "Contar solo lo `pending` haría creer que queda menos trabajo sin " +
        "subir del que hay; lo rechazado también sigue fuera del servidor.",
    );
  },
);
