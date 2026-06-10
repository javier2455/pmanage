"use client";

import { AlertTriangle, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getStockAlertStatus,
  STOCK_ALERT_LABELS,
} from "@/lib/stock-alert";

interface StockAlertBadgeProps {
  stock: number;
  /** Umbral configurado del producto. `null`/`undefined` = sin alerta. */
  threshold: number | null | undefined;
  /** Unidad del producto (kg, L, ud, …). Decide si el stock se redondea. */
  unit?: string | null;
  className?: string;
}

/**
 * Badge de estado de stock. Solo se muestra en estados de alerta:
 * - "out"  → rojo  "Sin stock"   (stock = 0, aunque no haya umbral)
 * - "low"  → ámbar "Stock bajo"  (stock <= umbral configurado, o <= default)
 * - "ok"   → no renderiza nada
 *
 * Cuando el producto no tiene umbral configurado, el badge cae al umbral por
 * defecto (`DEFAULT_LOW_STOCK_THRESHOLD`). Esto es **solo visual**: no marca la
 * campana como activa ni dispara notificaciones.
 *
 * Spec: docs/extra/análisis-planes/spec-tecnicas.md.
 */
export function StockAlertBadge({
  stock,
  threshold,
  unit,
  className,
}: StockAlertBadgeProps) {
  const status = getStockAlertStatus(stock, threshold, DEFAULT_LOW_STOCK_THRESHOLD, unit);

  if (status === "ok") return null;

  const isOut = status === "out";
  // El badge "low" se origina por el default cuando no hay umbral propio.
  const isDefaultThreshold = status === "low" && threshold == null;

  return (
    <Badge
      variant="secondary"
      title={
        isDefaultThreshold
          ? `Umbral por defecto (${DEFAULT_LOW_STOCK_THRESHOLD} unidades). Configura uno propio desde "Alerta de stock" para recibir avisos.`
          : undefined
      }
      className={cn(
        "text-xs",
        isOut
          ? "border-destructive/20 bg-destructive/10 text-destructive dark:text-red-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        className,
      )}
    >
      {isOut ? <PackageX /> : <AlertTriangle />}
      {STOCK_ALERT_LABELS[status]}
    </Badge>
  );
}
