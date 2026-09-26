// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildGoogleAuthUrl,
  GoogleAuthError,
  isUserCancellation,
  openGoogleAuthPopup,
} from "./google-oauth";
import { authRoutes } from "@/lib/routes/auth";

const GATEWAY_ORIGIN = "https://ms.dveloxsoft.com";

/** Doble de la ventana del popup con lo que usa el flujo. */
function createFakePopup() {
  return {
    closed: false,
    close: vi.fn(function (this: { closed: boolean }) {
      this.closed = true;
    }),
    // Presente a propósito: un test comprueba que NO se usa.
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

type FakePopup = ReturnType<typeof createFakePopup>;

function mockWindowOpen(popup: FakePopup | null) {
  return vi
    .spyOn(window, "open")
    .mockReturnValue(popup as unknown as Window | null);
}

/** Simula el `postMessage` que el gateway envía a la ventana `opener`. */
function emitMessage(data: unknown, origin: string = GATEWAY_ORIGIN) {
  window.dispatchEvent(new MessageEvent("message", { data, origin }));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("buildGoogleAuthUrl", () => {
  it("apunta al backend, no al gateway: el token de página es secreto y caduca", () => {
    const url = new URL(buildGoogleAuthUrl());
    expect(url.origin + url.pathname).toBe(authRoutes.google);
    expect(url.searchParams.get("state")).toBeNull();
  });

  it("incluye el origen del frontend, que el gateway exige para el postMessage", () => {
    const url = new URL(buildGoogleAuthUrl());
    expect(url.searchParams.get("origin")).toBe(window.location.origin);
  });
});

describe("openGoogleAuthPopup", () => {
  let popup: FakePopup;

  beforeEach(() => {
    popup = createFakePopup();
  });

  it("resuelve con los tokens que manda el gateway", async () => {
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup();

    emitMessage({ accessToken: "access-123", refreshToken: "refresh-456" });

    await expect(pending).resolves.toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-456",
    });
    expect(popup.close).toHaveBeenCalled();
  });

  it("admite también la convención snake_case", async () => {
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup();

    emitMessage({ access_token: "access-123", refresh_token: "refresh-456" });

    await expect(pending).resolves.toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-456",
    });
  });

  /*
   * Regresión del fallo que rompía el login en móvil.
   *
   * `window.open` abre primero un `about:blank` del mismo origen y lo descarga
   * al navegar al gateway. Suscribirse a `unload` del popup hacía que ese
   * primer `unload` cerrara la ventana recién abierta y devolviera al usuario
   * al login sin haber visto Google.
   */
  it("no se suscribe a ningún evento del popup", async () => {
    vi.useFakeTimers();
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup({ timeoutMs: 1000 });
    const assertion = expect(pending).rejects.toMatchObject({ reason: "timeout" });

    expect(popup.addEventListener).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("ignora mensajes de un dominio que solo CONTIENE el del gateway", async () => {
    vi.useFakeTimers();
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup({ timeoutMs: 1000 });
    const settled = vi.fn();
    pending.then(settled).catch(settled);

    emitMessage(
      { accessToken: "robado" },
      "https://ms.dveloxsoft.com.dominio-atacante.com",
    );
    await vi.advanceTimersByTimeAsync(0);

    expect(settled).not.toHaveBeenCalled();

    // Y al agotarse el tiempo termina en timeout, no con el token del atacante.
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).rejects.toMatchObject({ reason: "timeout" });
  });

  it("rechaza con popup-blocked si el navegador no deja abrir la ventana", async () => {
    mockWindowOpen(null);

    await expect(openGoogleAuthPopup()).rejects.toBeInstanceOf(GoogleAuthError);
    await expect(openGoogleAuthPopup()).rejects.toMatchObject({
      reason: "popup-blocked",
    });
  });

  it("propaga el mensaje de error del gateway", async () => {
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup();

    emitMessage({ type: "GOOGLE_AUTH_ERROR", message: "Origen no especificado" });

    await expect(pending).rejects.toMatchObject({
      reason: "gateway-error",
      message: "Origen no especificado",
    });
  });

  it("detecta que el usuario cerró la ventana", async () => {
    vi.useFakeTimers();
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup();
    const assertion = expect(pending).rejects.toSatisfy(isUserCancellation);

    popup.closed = true;
    await vi.advanceTimersByTimeAsync(2000);

    await assertion;
  });

  /*
   * El gateway hace `postMessage` y cierra la ventana acto seguido. Sin margen
   * de gracia, el sondeo de cierre podía ganarle al mensaje y dar por
   * cancelado un login que sí había funcionado.
   */
  it("un mensaje que llega mientras se cierra la ventana gana a la cancelación", async () => {
    vi.useFakeTimers();
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup();

    popup.closed = true;
    await vi.advanceTimersByTimeAsync(400); // el sondeo detecta el cierre
    emitMessage({ accessToken: "access-123" });
    await vi.advanceTimersByTimeAsync(1000); // vence el margen de gracia

    await expect(pending).resolves.toMatchObject({ accessToken: "access-123" });
  });

  it("rechaza por timeout si nunca llega respuesta", async () => {
    vi.useFakeTimers();
    mockWindowOpen(popup);
    const pending = openGoogleAuthPopup({ timeoutMs: 5000 });
    const assertion = expect(pending).rejects.toMatchObject({ reason: "timeout" });

    await vi.advanceTimersByTimeAsync(5000);

    await assertion;
    expect(popup.close).toHaveBeenCalled();
  });
});
