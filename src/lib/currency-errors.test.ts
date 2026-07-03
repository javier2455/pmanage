import { describe, expect, it } from "vitest";
import { mapCurrencyErrorFromBlob } from "./currency-errors";

/**
 * Tests de la variante async para respuestas `responseType: "blob"` (descarga
 * de factura, exports). Va en un *.test.ts normal (no en las suites del
 * harness compartido) porque es async y las suites de la UI admin son
 * síncronas.
 */

/** Simula un AxiosError cuyo body llegó como Blob (responseType: "blob"). */
function axiosBlobErrorWith(body: unknown): unknown {
  return {
    isAxiosError: true,
    response: {
      data: new Blob([typeof body === "string" ? body : JSON.stringify(body)], {
        type: "application/json",
      }),
    },
  };
}

describe("mapCurrencyErrorFromBlob · errores JSON dentro de un Blob", () => {
  it("parsea el Blob y mapea MONEDA_NO_CONFIGURADA (caso factura sin tasa)", async () => {
    const error = axiosBlobErrorWith({
      codigo: "MONEDA_NO_CONFIGURADA",
      mensaje: "No se puede generar la factura…",
    });

    const msg = await mapCurrencyErrorFromBlob(error);
    expect(msg).toContain("no tiene tasa configurada");
  });

  it("con message pero sin código conocido devuelve el message del backend", async () => {
    const error = axiosBlobErrorWith({
      message: "Solo se puede generar factura para ventas completamente pagadas",
    });

    const msg = await mapCurrencyErrorFromBlob(error);
    expect(msg).toBe(
      "Solo se puede generar factura para ventas completamente pagadas",
    );
  });

  it("Blob que no es JSON (HTML de un proxy) cae al fallback", async () => {
    const error = axiosBlobErrorWith("<html>502 Bad Gateway</html>");

    const msg = await mapCurrencyErrorFromBlob(error, "Fallback de factura.");
    expect(msg).toBe("Fallback de factura.");
  });

  it("error sin Blob se delega tal cual a mapCurrencyError (data JSON normal)", async () => {
    const error = {
      isAxiosError: true,
      response: { data: { codigo: "PAGO_EXCEDE_TOTAL" } },
    };

    const msg = await mapCurrencyErrorFromBlob(error);
    expect(msg).toBe("La suma de pagos supera el total pendiente de la venta.");
  });

  it("error no-axios devuelve el fallback", async () => {
    const msg = await mapCurrencyErrorFromBlob(new Error("boom"), "Fallback.");
    expect(msg).toBe("Fallback.");
  });
});
