// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OFFLINE_CACHE_KEYS,
  OFFLINE_CACHE_MAX_AGE_MS,
  clearOfflineCache,
  offlineCacheSavedAt,
  readOfflineCache,
  writeOfflineCache,
} from "./offline-cache";

describe("offline-cache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("guarda y recupera el valor tal cual", () => {
    const sections = [{ id: "s1", name: "Negocio", menus: [] }];
    writeOfflineCache("nav", sections);
    expect(readOfflineCache("nav")).toEqual(sections);
  });

  it("devuelve undefined cuando no hay nada guardado", () => {
    expect(readOfflineCache("no-existe")).toBeUndefined();
  });

  /**
   * `undefined` y no `null`: es lo que React Query interpreta como "sin dato
   * inicial" en `initialData`. Devolver `null` haría que pintara una lista
   * vacía como si el servidor hubiese respondido eso.
   */
  it("el fallo se expresa como undefined, no como null", () => {
    expect(readOfflineCache("no-existe")).not.toBeNull();
    expect(readOfflineCache("no-existe")).toBeUndefined();
  });

  it("descarta lo caducado y limpia la entrada", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    writeOfflineCache("nav", ["viejo"]);

    vi.setSystemTime(new Date(Date.now() + OFFLINE_CACHE_MAX_AGE_MS + 1000));
    expect(readOfflineCache("nav")).toBeUndefined();
    // Se borra en vez de quedarse ocupando espacio para siempre.
    expect(localStorage.getItem("negora:offline-cache:nav")).toBeNull();
  });

  it("respeta una caducidad más corta pedida por el llamador", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    writeOfflineCache("nav", ["dato"]);

    vi.setSystemTime(new Date(Date.now() + 60_000));
    expect(readOfflineCache("nav", 30_000)).toBeUndefined();
    expect(readOfflineCache("nav", 120_000)).toEqual(["dato"]);
  });

  it("un JSON corrupto se trata como ausencia de caché, sin lanzar", () => {
    localStorage.setItem("negora:offline-cache:nav", "{esto no es json");
    expect(() => readOfflineCache("nav")).not.toThrow();
    expect(readOfflineCache("nav")).toBeUndefined();
  });

  it("una entrada sin marca de tiempo se descarta", () => {
    localStorage.setItem(
      "negora:offline-cache:nav",
      JSON.stringify({ data: ["sin savedAt"] }),
    );
    expect(readOfflineCache("nav")).toBeUndefined();
  });

  it("expone cuándo se guardó, para poder avisar de la antigüedad", () => {
    vi.useFakeTimers();
    const now = new Date("2026-08-18T10:30:00Z");
    vi.setSystemTime(now);
    writeOfflineCache("nav", ["dato"]);
    expect(offlineCacheSavedAt("nav")?.toISOString()).toBe(now.toISOString());
    expect(offlineCacheSavedAt("no-existe")).toBeNull();
  });

  it("clearOfflineCache borra lo propio y respeta el resto de localStorage", () => {
    writeOfflineCache("nav", ["a"]);
    writeOfflineCache("otra", ["b"]);
    localStorage.setItem("ajeno", "conservar");

    clearOfflineCache();

    expect(readOfflineCache("nav")).toBeUndefined();
    expect(readOfflineCache("otra")).toBeUndefined();
    expect(localStorage.getItem("ajeno")).toBe("conservar");
  });

  it("las claves de navegación distinguen por negocio", () => {
    const a = OFFLINE_CACHE_KEYS.navigationSections("biz-1");
    const b = OFFLINE_CACHE_KEYS.navigationSections("biz-2");
    expect(a).not.toBe(b);
    // Sin negocio activo también tiene clave propia, no comparte con ninguno.
    expect(OFFLINE_CACHE_KEYS.navigationSections(null)).not.toBe(a);
  });

  it("escribir nunca lanza aunque el almacenamiento falle", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    expect(() => writeOfflineCache("nav", ["dato"])).not.toThrow();
    setItem.mockRestore();
  });
});
