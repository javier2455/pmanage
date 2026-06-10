import type { ProductUnit } from "@/lib/types/product";

/**
 * Unidades que se cuentan en piezas enteras y NO admiten fracciones.
 * El resto (kg, lb, g, L, mL) son de peso/volumen y pueden ser decimales
 * (p. ej. quedar con 0,4 kg tras una venta).
 */
const INTEGER_UNITS: ReadonlySet<string> = new Set<ProductUnit>(["ud"]);

/** `true` para unidades enteras (`ud`) o cuando la unidad es desconocida. */
export function isIntegerUnit(unit: string | null | undefined): boolean {
  return unit == null || INTEGER_UNITS.has(unit);
}

/**
 * Normaliza una cantidad de stock a `number` según su unidad:
 * - `ud` (o desconocida) → entero (`Math.round`)
 * - peso/volumen        → número con decimales
 *
 * Siempre devuelve un `number` (0 si el valor no es parseable). El backend
 * puede mandar el stock como string ("0.40"), por eso se coacciona con `Number`.
 *
 * Es la ÚNICA fuente de verdad para "cuánto stock hay": tanto el texto que se
 * muestra (`formatStockWithUnit`) como el badge de alerta (`getStockAlertStatus`)
 * la usan, de modo que el número mostrado y el estado del badge nunca difieran.
 */
export function normalizeStock(
  value: number | string | null | undefined,
  unit?: string | null,
): number {
  const n = Number(value) || 0;
  return isIntegerUnit(unit) ? Math.round(n) : n;
}

/**
 * Formatea una cantidad con su unidad para mostrar al usuario:
 * - `ud` → "1 unidad" / "12 unidades"
 * - peso/volumen → "0,4 kg", "2,5 L" (hasta 3 decimales, sin ceros sobrantes)
 */
export function formatStockWithUnit(
  value: number | string | null | undefined,
  unit?: string | null,
): string {
  const n = normalizeStock(value, unit);

  if (isIntegerUnit(unit)) {
    const label = n === 1 ? "unidad" : "unidades";
    return `${n.toLocaleString("es-CO")} ${label}`;
  }

  const formatted = n.toLocaleString("es-CO", { maximumFractionDigits: 3 });
  return `${formatted} ${unit}`;
}
