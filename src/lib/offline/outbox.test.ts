// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Estas pruebas corren contra Dexie DE VERDAD, sobre una IndexedDB simulada en
 * memoria. Un doble hecho a mano habría sido más corto, pero probaría el doble:
 * lo que se quiere comprobar aquí —que `modify` respeta el estado, que el
 * autoincremental da el orden FIFO, que una operación rechazada NO se vuelve a
 * coger— depende del comportamiento real del almacén.
 */
import { offlineDb } from "@/lib/db/offline-db";
import {
  discardOperation,
  enqueueOperation,
  listDueOperations,
  listOutbox,
  markInflight,
  pruneDoneOperations,
  recoverStaleInflight,
  releaseInflight,
} from "./outbox";
import { MAX_ATTEMPTS, retryDelayMs } from "./outbox-policy";
import { runSync } from "./sync-runner";

const pushOperations = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/sync", () => ({ pushOperations }));

const BIZ = "biz-1";
const USER = "user-1";

async function enqueueSale(label: string) {
  return enqueueOperation({
    type: "sale.create",
    businessId: BIZ,
    userId: USER,
    payload: { idbusiness: BIZ, items: [] },
    label,
  });
}

beforeEach(async () => {
  pushOperations.mockReset();
  await offlineDb()?.outbox.clear();
});

describe("cola de operaciones", () => {
  it("encolar conserva el orden en que ocurrieron las cosas", async () => {
    const first = await enqueueSale("Venta 1");
    const second = await enqueueSale("Venta 2");

    expect(second.seq).toBeGreaterThan(first.seq as number);
    expect((await listOutbox(BIZ)).map((op) => op.label)).toEqual([
      "Venta 1",
      "Venta 2",
    ]);
  });

  /**
   * La cola sobrevive al cierre de sesión porque contiene trabajo sin subir.
   * En un mostrador compartido, subir las ventas de quien salió con la sesión
   * de quien entró las registraría a nombre equivocado.
   */
  it("solo se suben las operaciones de quien tiene la sesión", async () => {
    await enqueueSale("Mía");
    await enqueueOperation({
      type: "sale.create",
      businessId: BIZ,
      userId: "otro-usuario",
      payload: {},
      label: "De otra persona",
    });

    const due = await listDueOperations({ businessId: BIZ, userId: USER });
    expect(due.map((op) => op.label)).toEqual(["Mía"]);
  });

  it("lo que se está enviando no lo coge nadie más", async () => {
    const op = await enqueueSale("Venta");
    await markInflight([op.seq as number]);

    expect(await listDueOperations({ businessId: BIZ, userId: USER })).toEqual(
      [],
    );
  });

  it("un envío cortado devuelve el trabajo a la cola sin gastar intentos", async () => {
    const op = await enqueueSale("Venta");
    await markInflight([op.seq as number]);

    await releaseInflight([op.seq as number], {
      at: Date.now(),
      code: null,
      message: "Sin conexión.",
      status: null,
    });

    const [stored] = await listOutbox(BIZ);
    expect(stored.status).toBe("pending");
    expect(stored.attempts).toBe(0);
  });

  it("rescata lo que quedó a medio subir de una sesión anterior", async () => {
    const op = await enqueueSale("Venta");
    await markInflight([op.seq as number]);

    expect(await recoverStaleInflight()).toBe(1);
    expect((await listOutbox(BIZ))[0].status).toBe("pending");
  });

  it("no se puede descartar algo que se está enviando", async () => {
    const op = await enqueueSale("Venta");
    await markInflight([op.seq as number]);

    expect(await discardOperation(op.seq as number)).toBe(false);
    expect(await listOutbox(BIZ)).toHaveLength(1);
  });

  it("la purga solo toca el historial ya subido", async () => {
    const done = await enqueueSale("Subida");
    const pending = await enqueueSale("Sin subir");
    const old = Date.now() - 30 * 24 * 60 * 60 * 1000;
    await offlineDb()?.outbox.update(done.seq as number, {
      status: "done",
      updatedAt: old,
    });
    await offlineDb()?.outbox.update(pending.seq as number, { updatedAt: old });

    await pruneDoneOperations();

    expect((await listOutbox(BIZ)).map((op) => op.label)).toEqual([
      "Sin subir",
    ]);
  });
});

describe("subida de la cola", () => {
  it("una venta aceptada se cierra y deja de contar", async () => {
    const op = await enqueueSale("Venta");
    pushOperations.mockResolvedValue({
      batchId: "b1",
      serverTime: new Date().toISOString(),
      summary: { applied: 1, failed: 0, duplicate: 0 },
      results: [
        { clientOperationId: op.id, status: "applied", entityId: "sale-1" },
      ],
    });

    const result = await runSync({ businessId: BIZ, userId: USER });

    expect(result.applied).toBe(1);
    expect((await listOutbox(BIZ))[0].status).toBe("done");
  });

  /**
   * El caso que justifica toda la idempotencia: la petición en línea llegó, el
   * servidor la aplicó y la respuesta se perdió. Al subir la cola el servidor
   * reconoce la operación y devuelve la venta que ya existe.
   */
  it("una venta que el servidor ya tenía no se duplica", async () => {
    const op = await enqueueSale("Venta");
    pushOperations.mockResolvedValue({
      batchId: "b1",
      serverTime: new Date().toISOString(),
      summary: { applied: 1, failed: 0, duplicate: 1 },
      results: [
        {
          clientOperationId: op.id,
          status: "applied",
          entityId: "sale-1",
          duplicate: true,
        },
      ],
    });

    const result = await runSync({ businessId: BIZ, userId: USER });

    expect(result.applied).toBe(1);
    expect(result.duplicated).toBe(1);
  });

  it("una venta rechazada queda visible y no se reintenta sola", async () => {
    const op = await enqueueSale("Venta");
    pushOperations.mockResolvedValue({
      batchId: "b1",
      serverTime: new Date().toISOString(),
      summary: { applied: 0, failed: 1, duplicate: 0 },
      results: [
        {
          clientOperationId: op.id,
          status: "failed",
          error: { code: "422", message: "No hay stock de «Café»." },
        },
      ],
    });

    await runSync({ businessId: BIZ, userId: USER });

    const [stored] = await listOutbox(BIZ);
    expect(stored.status).toBe("rejected");
    expect(stored.lastError?.message).toBe("No hay stock de «Café».");
    expect(await listDueOperations({ businessId: BIZ, userId: USER })).toEqual(
      [],
    );
  });

  it("sin conexión el trabajo se queda intacto para el próximo intento", async () => {
    await enqueueSale("Venta");
    pushOperations.mockRejectedValue(
      Object.assign(new Error("Network Error"), {
        isAxiosError: true,
        response: undefined,
      }),
    );

    const result = await runSync({ businessId: BIZ, userId: USER });

    expect(result.stoppedBy?.kind).toBe("retry");
    const [stored] = await listOutbox(BIZ);
    expect(stored.status).toBe("pending");
    expect(stored.attempts).toBe(0);
  });

  it("con la sesión caducada la cola se detiene sin perder nada", async () => {
    await enqueueSale("Venta");
    pushOperations.mockRejectedValue(
      Object.assign(new Error("401"), {
        isAxiosError: true,
        response: { status: 401 },
      }),
    );

    const result = await runSync({ businessId: BIZ, userId: USER });

    expect(result.stoppedBy?.kind).toBe("pause");
    expect((await listOutbox(BIZ))[0].status).toBe("pending");
  });

  it("un fallo transitorio del servidor espera antes de volver a intentarlo", async () => {
    const op = await enqueueSale("Venta");
    pushOperations.mockResolvedValue({
      batchId: "b1",
      serverTime: new Date().toISOString(),
      summary: { applied: 0, failed: 1, duplicate: 0 },
      results: [
        {
          clientOperationId: op.id,
          status: "failed",
          error: { code: "500", message: "Fallo interno." },
        },
      ],
    });

    const before = Date.now();
    await runSync({ businessId: BIZ, userId: USER });

    const [stored] = await listOutbox(BIZ);
    expect(stored.status).toBe("failed");
    expect(stored.attempts).toBe(1);
    expect(stored.nextAttemptAt).toBeGreaterThanOrEqual(
      before + retryDelayMs(1),
    );
    expect(await listDueOperations({ businessId: BIZ, userId: USER })).toEqual(
      [],
    );
  });

  it("tras agotar los intentos deja de reintentarse y se enseña", async () => {
    const op = await enqueueSale("Venta");
    await offlineDb()?.outbox.update(op.seq as number, {
      attempts: MAX_ATTEMPTS - 1,
    });
    pushOperations.mockResolvedValue({
      batchId: "b1",
      serverTime: new Date().toISOString(),
      summary: { applied: 0, failed: 1, duplicate: 0 },
      results: [
        {
          clientOperationId: op.id,
          status: "failed",
          error: { code: "500", message: "Fallo interno." },
        },
      ],
    });

    await runSync({ businessId: BIZ, userId: USER });

    expect((await listOutbox(BIZ))[0].status).toBe("rejected");
  });

  it("sin nada que subir no se llama al servidor", async () => {
    const result = await runSync({ businessId: BIZ, userId: USER });

    expect(pushOperations).not.toHaveBeenCalled();
    expect(result.applied).toBe(0);
  });

  it("las operaciones viajan en el orden en que ocurrieron", async () => {
    const first = await enqueueSale("Venta 1");
    const second = await enqueueSale("Venta 2");
    pushOperations.mockResolvedValue({
      batchId: "b1",
      serverTime: new Date().toISOString(),
      summary: { applied: 2, failed: 0, duplicate: 0 },
      results: [
        { clientOperationId: first.id, status: "applied" },
        { clientOperationId: second.id, status: "applied" },
      ],
    });

    await runSync({ businessId: BIZ, userId: USER });

    const body = pushOperations.mock.calls[0][0];
    expect(body.operations.map((o: { clientOperationId: string }) => o.clientOperationId)).toEqual([
      first.id,
      second.id,
    ]);
    expect(body.businessId).toBe(BIZ);
  });
});
