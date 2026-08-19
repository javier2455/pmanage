import { describe, expect, it } from "vitest";
import { resolveAppShellState } from "./use-app-shell-status";

describe("estado de la aplicación en el dispositivo", () => {
  /**
   * La distinción que importa. `absent` exige conexión para arreglarse;
   * `installing` se arregla sola esperando. Confundirlas manda a la persona a
   * hacer justo lo contrario de lo que necesita.
   */
  it("sin service worker sirviendo la página, la aplicación NO está guardada", () => {
    expect(
      resolveAppShellState({ controlled: false, precached: 0, total: 0 }),
    ).toBe("absent");
  });

  it("con todo descargado, está guardada", () => {
    expect(
      resolveAppShellState({ controlled: true, precached: 780, total: 780 }),
    ).toBe("ready");
  });

  it("a medias, se está descargando", () => {
    expect(
      resolveAppShellState({ controlled: true, precached: 12, total: 780 }),
    ).toBe("installing");
  });

  /**
   * Que no conteste no significa que falte: puede estar arrancando. Decir
   * «no está guardada» ahí sería una alarma falsa cada vez que se abre el
   * aviso demasiado pronto.
   */
  it("sin respuesta todavía no se afirma nada", () => {
    expect(resolveAppShellState(null)).toBe("unknown");
  });
});
