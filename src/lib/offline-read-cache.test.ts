// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isNetworkError, withOfflineFallback } from "./offline-read-cache";

/**
 * La base local se sustituye por un doble: `fake-indexeddb` no está instalado y
 * lo que se prueba aquí es la POLÍTICA (cuándo se recurre a la copia), no el
 * almacenamiento en sí.
 */
const store = new Map<string, { data: unknown; savedAt: number }>();

vi.mock("@/lib/db/offline-db", () => ({
  offlineDb: () => ({
    readCache: {
      put: async (row: { key: string; data: unknown; savedAt: number }) => {
        store.set(row.key, { data: row.data, savedAt: row.savedAt });
      },
      get: async (key: string) => {
        const row = store.get(key);
        return row ? { key, ...row } : undefined;
      },
      delete: async (key: string) => {
        store.delete(key);
      },
      clear: async () => store.clear(),
    },
  }),
  readCacheKey: (name: string, businessId: string | null) =>
    `${name}:${businessId ?? "none"}`,
}));

const axiosNetworkError = () =>
  Object.assign(new Error("Network Error"), {
    isAxiosError: true,
    response: undefined,
  });

const axiosHttpError = (status: number) =>
  Object.assign(new Error(`Request failed with status ${status}`), {
    isAxiosError: true,
    response: { status },
  });

describe("isNetworkError", () => {
  it("un error de axios sin respuesta es fallo de red", () => {
    expect(isNetworkError(axiosNetworkError())).toBe(true);
  });

  /**
   * Clave: un 403 o un 422 son respuestas legítimas del servidor. Servir datos
   * viejos en su lugar taparía el problema real —permiso revocado, plan
   * vencido— y el usuario nunca sabría por qué "todo va bien" pero nada se
   * guarda.
   */
  it("un error HTTP con respuesta NO es fallo de red", () => {
    expect(isNetworkError(axiosHttpError(403))).toBe(false);
    expect(isNetworkError(axiosHttpError(422))).toBe(false);
    expect(isNetworkError(axiosHttpError(500))).toBe(false);
  });

  it("un error cualquiera no cuenta como fallo de red", () => {
    expect(isNetworkError(new Error("boom"))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError("texto")).toBe(false);
  });
});

describe("withOfflineFallback", () => {
  beforeEach(() => store.clear());

  it("con red devuelve lo del servidor y guarda una copia", async () => {
    const fetcher = vi.fn().mockResolvedValue([{ id: "p1", name: "Café" }]);
    const query = withOfflineFallback("productos", "biz-1", fetcher);

    expect(await query()).toEqual([{ id: "p1", name: "Café" }]);
    // La escritura es en segundo plano; se espera un tick.
    await new Promise((r) => setTimeout(r, 0));
    expect(store.get("productos")?.data).toEqual([{ id: "p1", name: "Café" }]);
  });

  it("sin red devuelve la última copia guardada", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce([{ id: "p1" }])
      .mockRejectedValueOnce(axiosNetworkError());
    const query = withOfflineFallback("productos", "biz-1", fetcher);

    await query();
    await new Promise((r) => setTimeout(r, 0));

    expect(await query()).toEqual([{ id: "p1" }]);
  });

  it("sin red y sin copia, el error se propaga", async () => {
    const error = axiosNetworkError();
    const query = withOfflineFallback(
      "sin-copia",
      "biz-1",
      vi.fn().mockRejectedValue(error),
    );

    await expect(query()).rejects.toBe(error);
  });

  it("un error del servidor se propaga aunque HAYA copia guardada", async () => {
    const httpError = axiosHttpError(403);
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce([{ id: "p1" }])
      .mockRejectedValueOnce(httpError);
    const query = withOfflineFallback("productos", "biz-1", fetcher);

    await query();
    await new Promise((r) => setTimeout(r, 0));

    await expect(query()).rejects.toBe(httpError);
  });

  it("estando en línea NUNCA sirve la copia: manda el servidor", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce([{ id: "viejo" }])
      .mockResolvedValueOnce([{ id: "nuevo" }]);
    const query = withOfflineFallback("productos", "biz-1", fetcher);

    await query();
    await new Promise((r) => setTimeout(r, 0));

    expect(await query()).toEqual([{ id: "nuevo" }]);
  });

  it("un fallo al guardar no rompe la consulta que fue bien", async () => {
    const fetcher = vi.fn().mockResolvedValue(["dato"]);
    const query = withOfflineFallback("productos", "biz-1", fetcher);
    // `structuredClone` de algo no clonable revienta dentro del guardado.
    const noClonable = { fn: () => undefined };
    const queryNoClonable = withOfflineFallback(
      "raro",
      "biz-1",
      vi.fn().mockResolvedValue(noClonable),
    );

    await expect(query()).resolves.toEqual(["dato"]);
    await expect(queryNoClonable()).resolves.toBe(noClonable);
  });
});
