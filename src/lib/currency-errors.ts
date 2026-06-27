import axios from "axios";

/**
 * Mapea los códigos de error multimoneda del backend a un mensaje claro en
 * español. El backend devuelve un `codigo` (o `code`/`error`) además del
 * `message`. Centralizado aquí para reutilizar entre pagos, asignar producto y
 * agregar stock. Ver docs/multimoneda-productos.md §3.
 */
export function mapCurrencyError(
  error: unknown,
  fallback = "No se pudo completar la operación. Intenta de nuevo.",
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { codigo?: string; code?: string; error?: string; message?: string }
      | undefined;
    const code =
      data?.codigo ?? data?.code ?? data?.error ?? data?.message ?? "";
    if (code.includes("PAGO_EXCEDE_TOTAL"))
      return "La suma de pagos supera el total pendiente de la venta.";
    if (code.includes("MONEDAS_NO_CONFIGURADAS"))
      return "El negocio no tiene tasas de cambio configuradas. Configúralas en la sección de Tasas de cambio.";
    // MONEDA_COMPRA_NO_CONFIGURADA es la variante de addStock; el include cubre ambas.
    if (code.includes("MONEDA_NO_CONFIGURADA") || code.includes("MONEDA_COMPRA_NO_CONFIGURADA"))
      return "La moneda seleccionada no tiene tasa configurada en el negocio. Configúrala en Tasas de cambio.";
    if (data?.message) return data.message;
  }
  return fallback;
}
