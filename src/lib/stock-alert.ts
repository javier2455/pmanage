import type { StockAlertStatus } from "@/lib/types/inventory";

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
 */
export function getStockAlertStatus(
    stock: number,
    threshold: number | null | undefined,
    defaultThreshold?: number | null,
): StockAlertStatus {
    if (stock <= 0) return "out";
    const effectiveThreshold = threshold ?? defaultThreshold;
    if (effectiveThreshold != null && stock <= effectiveThreshold) return "low";
    return "ok";
}

/** Etiqueta legible por estado. */
export const STOCK_ALERT_LABELS: Record<StockAlertStatus, string> = {
    out: "Sin stock",
    low: "Stock bajo",
    ok: "Disponible",
};
