import { defineSuite, expect } from "@/testing/harness";
import { mapCurrencyError } from "@/lib/currency-errors";

/** Simula un AxiosError con `response.data` (lo que detecta axios.isAxiosError). */
function axiosErrorWith(data: Record<string, unknown>): unknown {
  return { isAxiosError: true, response: { data } };
}

export const currencyErrorsSuite = defineSuite(
  "currency-errors · mensajes de error multimoneda",
  ({ test }) => {
    test(
      "PAGO_EXCEDE_TOTAL → mensaje de pago que supera el total",
      () => {
        expect(mapCurrencyError(axiosErrorWith({ codigo: "PAGO_EXCEDE_TOTAL" }))).toBe(
          "La suma de pagos supera el total pendiente de la venta.",
        );
      },
      "Traduce el código del backend 'PAGO_EXCEDE_TOTAL' a un mensaje claro en español que el usuario entiende, en lugar del código crudo.",
    );

    test(
      "MONEDAS_NO_CONFIGURADAS → invita a configurar tasas",
      () => {
        const msg = mapCurrencyError(axiosErrorWith({ code: "MONEDAS_NO_CONFIGURADAS" }));
        expect(msg).toContain("no tiene tasas de cambio configuradas");
      },
      "Cuando el negocio no tiene tasas configuradas, devuelve un mensaje que guía al usuario a la sección de Tasas de cambio. También prueba que lee el código desde el campo 'code' (no solo 'codigo').",
    );

    test(
      "MONEDA_NO_CONFIGURADA y su variante de compra comparten mensaje",
      () => {
        const a = mapCurrencyError(axiosErrorWith({ error: "MONEDA_NO_CONFIGURADA" }));
        const b = mapCurrencyError(axiosErrorWith({ error: "MONEDA_COMPRA_NO_CONFIGURADA" }));
        expect(a).toContain("no tiene tasa configurada");
        expect(b).toContain("no tiene tasa configurada");
      },
      "Tanto el error de venta (MONEDA_NO_CONFIGURADA) como el de compra/addStock (MONEDA_COMPRA_NO_CONFIGURADA) producen el mismo mensaje, porque el include cubre ambas variantes. Prueba además la lectura desde 'error'.",
    );

    test(
      "código desconocido con message → devuelve el message del backend",
      () => {
        const msg = mapCurrencyError(
          axiosErrorWith({ message: "Saldo insuficiente en la cuenta." }),
        );
        expect(msg).toBe("Saldo insuficiente en la cuenta.");
      },
      "Si no hay un código conocido pero el backend envió un 'message', se muestra ese mensaje tal cual en vez del fallback genérico.",
    );

    test(
      "error no-axios → mensaje fallback",
      () => {
        expect(mapCurrencyError(new Error("boom"))).toBe(
          "No se pudo completar la operación. Intenta de nuevo.",
        );
        expect(mapCurrencyError(null)).toBe(
          "No se pudo completar la operación. Intenta de nuevo.",
        );
      },
      "Ante un error que no viene de axios (Error genérico, null, fallo de red sin response), devuelve el mensaje fallback por defecto para nunca dejar al usuario sin feedback.",
    );

    test(
      "fallback personalizado",
      () => {
        expect(mapCurrencyError(null, "Algo salió mal.")).toBe("Algo salió mal.");
      },
      "El segundo argumento permite personalizar el mensaje fallback según el contexto (pago, asignar producto, agregar stock).",
    );
  },
  { description: "Traduce códigos de error del backend a mensajes en español." },
);
