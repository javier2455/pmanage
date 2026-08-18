// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { offlineDb } from "@/lib/db/offline-db";
import { listOutbox } from "./outbox";
import { createSaleOrQueue } from "./sale-sync";

const postCreateSale = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/sale", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/sale")>()),
  postCreateSale,
}));

const CREDENTIALS = {
  idbusiness: "biz-1",
  descripcion: "",
  currency: "CUP",
  items: [{ idproducto: "p1", quantity: 2, price: 100 }],
};

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    value,
    configurable: true,
  });
}

const networkError = () =>
  Object.assign(new Error("Network Error"), {
    isAxiosError: true,
    response: undefined,
  });

beforeEach(async () => {
  postCreateSale.mockReset();
  await offlineDb()?.outbox.clear();
  setOnline(true);
  // La cola necesita saber de quién es el trabajo que guarda.
  sessionStorage.setItem("user", JSON.stringify({ email: "ana@negora.cu" }));
});

afterEach(() => sessionStorage.clear());

describe("registrar una venta", () => {
  it("con red va al servidor y no toca la cola", async () => {
    postCreateSale.mockResolvedValue({ id: "sale-1" });

    const result = await createSaleOrQueue(CREDENTIALS);

    expect(result).toEqual({ queued: false, sale: { id: "sale-1" } });
    expect(await listOutbox("biz-1")).toHaveLength(0);
  });

  /**
   * Sin esto, quien está cobrando se come el tiempo límite completo mirando el
   * botón «Registrando…» girando, con el cliente delante, para acabar en el
   * mismo sitio: la venta encolada.
   */
  it("sin enlace de red se encola SIN intentar la petición", async () => {
    setOnline(false);

    const result = await createSaleOrQueue(CREDENTIALS);

    expect(postCreateSale).not.toHaveBeenCalled();
    expect(result.queued).toBe(true);
    expect(await listOutbox("biz-1")).toHaveLength(1);
  });

  it("si la petición sale y no vuelve, se encola con la MISMA clave", async () => {
    postCreateSale.mockRejectedValue(networkError());

    const result = await createSaleOrQueue(CREDENTIALS);

    if (result.queued === false) throw new Error("debía encolarse");
    const enviado = postCreateSale.mock.calls[0][1];
    expect(result.operation.id).toBe(enviado);
    // La duda de si llegó queda anotada; la resuelve el servidor al subirla.
    expect(result.operation.needsManualCheck).toBe(true);
  });

  it("un rechazo del servidor se propaga y NO se encola", async () => {
    const rechazo = Object.assign(new Error("422"), {
      isAxiosError: true,
      response: { status: 422, data: { mensaje: "No hay stock." } },
    });
    postCreateSale.mockRejectedValue(rechazo);

    await expect(createSaleOrQueue(CREDENTIALS)).rejects.toBe(rechazo);
    expect(await listOutbox("biz-1")).toHaveLength(0);
  });

  it("la venta encolada guarda el cuerpo que espera el servidor", async () => {
    setOnline(false);

    const result = await createSaleOrQueue({
      ...CREDENTIALS,
      currency: "CUP_TRANSFERENCIA",
    });

    if (result.queued === false) throw new Error("debía encolarse");
    // La moneda viaja traducida a la forma del backend, igual que en línea. Si
    // se encolara la forma interna, el servidor calcularía otra huella del
    // cuerpo y leería la clave de idempotencia como reutilizada: la venta se
    // rechazaría al subirla.
    expect(result.operation.payload).toEqual({
      ...CREDENTIALS,
      currency: "cup_transferencia",
    });
    expect(result.operation.label).toContain("200.00");
  });
});
