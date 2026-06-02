import type { StockAlertStatus } from "@/lib/types/inventory";

/**
 * Deriva el estado de alerta de un producto a partir de su stock y umbral.
 *
 * Reglas (alineadas con docs/extra/análisis-planes/spec-tecnicas.md, con una
 * mejora: "agotado" se muestra aunque no haya umbral configurado, porque el
 * stock en 0 siempre es relevante — la feature pedida es "stock bajo *o* 0"):
 *
 * - `stock === 0`                         → "out"  (agotado)
 * - `threshold != null && stock <= umbral`→ "low"  (stock bajo)
 * - resto                                 → "ok"   (sin alerta)
 */
export function getStockAlertStatus(
    stock: number,
    threshold: number | null | undefined,
): StockAlertStatus {
    if (stock <= 0) return "out";
    if (threshold != null && stock <= threshold) return "low";
    return "ok";
}

/** Etiqueta legible por estado. */
export const STOCK_ALERT_LABELS: Record<StockAlertStatus, string> = {
    out: "Sin stock",
    low: "Stock bajo",
    ok: "Disponible",
};
