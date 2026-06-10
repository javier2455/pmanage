import type { StockAlertStatus } from "@/lib/types/inventory";
import { normalizeStock } from "@/lib/units";

/**
 * Umbral por defecto para el badge "Stock bajo" cuando el producto NO tiene uno
 * configurado. Es **solo visual**: no activa la campana de alerta ni dispara
 * notificaciones (eso requiere un umbral configurado de verdad). Para cambiar el
 * valor por defecto, edita esta constante.
 */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Deriva el estado de alerta de un producto a partir de su stock y umbral.
 *
 * Reglas (alineadas con docs/extra/análisis-planes/spec-tecnicas.md, con una
 * mejora: "agotado" se muestra aunque no haya umbral configurado, porque el
 * stock en 0 siempre es relevante — la feature pedida es "stock bajo *o* 0"):
 *
 * - `stock === 0`                              → "out"  (agotado)
 * - `umbralEfectivo != null && stock <= umbral`→ "low"  (stock bajo)
 * - resto                                      → "ok"   (sin alerta)
 *
 * `defaultThreshold` permite pintar el badge con un umbral por defecto cuando el
 * producto no tiene uno configurado (`threshold == null`). Es solo para el badge
 * visual: NO debe usarse para el estado de la campana ni para disparar avisos.
 *
 * IMPORTANTE: el backend puede devolver el stock como string con decimales
 * (p. ej. "0.40"). Lo normalizamos con `normalizeStock`, que es la MISMA función
 * que usa el texto mostrado (`formatStockWithUnit`), para que el badge y el
 * número visible nunca difieran. La normalización depende de la unidad:
 * - `ud` (piezas) → se redondea a entero, así "0.40 ud" se muestra como 0 y el
 *   badge sale "Sin stock" (no "Stock bajo").
 * - peso/volumen (kg, L, …) → se respeta el decimal, así "0,4 kg" es stock real
 *   y el badge sale "Stock bajo" (hay producto), no "Sin stock".
 */
export function getStockAlertStatus(
    stock: number | string | null | undefined,
    threshold: number | null | undefined,
    defaultThreshold?: number | null,
    unit?: string | null,
): StockAlertStatus {
    const normalizedStock = normalizeStock(stock, unit);
    if (normalizedStock <= 0) return "out";
    const effectiveThreshold = threshold ?? defaultThreshold;
    if (effectiveThreshold != null && normalizedStock <= effectiveThreshold) return "low";
    return "ok";
}

/** Etiqueta legible por estado. */
export const STOCK_ALERT_LABELS: Record<StockAlertStatus, string> = {
    out: "Sin stock",
    low: "Stock bajo",
    ok: "Disponible",
};
