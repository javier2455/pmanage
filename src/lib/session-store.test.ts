// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_KEYS, sessionStore } from "./session-store";

/**
 * `sessionStore` migra de forma perezosa y una sola vez por carga de página,
 * así que cada caso necesita el módulo recién evaluado para observar esa
 * primera vez. Es lo que simula abrir la aplicación de nuevo.
 */
async function freshStore() {
  vi.resetModules();
  return import("./session-store");
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("almacén de sesión", () => {
  /**
   * El caso que justifica todo el cambio: cerrar la aplicación no puede dejar
   * fuera a quien está sin conexión, porque volver a entrar exige al servidor
   * de autenticación.
   */
  it("la sesión sobrevive a cerrar la aplicación", async () => {
    sessionStore.setItem("token", "jwt-123");

    // Cerrar la pestaña vacía `sessionStorage`, no `localStorage`.
    sessionStorage.clear();
    const afterRestart = await freshStore();

    expect(afterRestart.sessionStore.getItem("token")).toBe("jwt-123");
  });

  it("rescata una sesión abierta con la versión anterior", async () => {
    sessionStorage.setItem("token", "jwt-viejo");
    sessionStorage.setItem("refresh_token", "refresh-viejo");

    const store = (await freshStore()).sessionStore;

    expect(store.getItem("token")).toBe("jwt-viejo");
    expect(store.getItem("refresh_token")).toBe("refresh-viejo");
  });

  it("la sesión ya migrada gana sobre el resto de la anterior", async () => {
    localStorage.setItem("token", "jwt-nuevo");
    sessionStorage.setItem("token", "jwt-viejo");

    expect((await freshStore()).sessionStore.getItem("token")).toBe("jwt-nuevo");
  });

  /**
   * Sutil y peligroso: si al cerrar sesión solo se borrara `localStorage`, la
   * migración perezosa resucitaría desde `sessionStorage` la sesión que se
   * acaba de cerrar.
   */
  it("cerrar sesión no deja nada que se pueda resucitar", async () => {
    sessionStorage.setItem("token", "jwt-viejo");
    sessionStore.setItem("user", JSON.stringify({ email: "ana@negora.cu" }));

    sessionStore.clear();

    const store = (await freshStore()).sessionStore;
    for (const key of SESSION_KEYS) {
      expect(store.getItem(key)).toBe(null);
    }
  });

  it("una clave que no existe devuelve null", () => {
    expect(sessionStore.getItem("activeBusinessId")).toBe(null);
  });
});
