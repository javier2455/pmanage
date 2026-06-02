"use client";

import { AlertTriangle, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getStockAlertStatus, STOCK_ALERT_LABELS } from "@/lib/stock-alert";

interface StockAlertBadgeProps {
  stock: number;
  /** Umbral configurado del producto. `null`/`undefined` = sin alerta. */
  threshold: number | null | undefined;
  className?: string;
}

/**
 * Badge de estado de stock. Solo se muestra en estados de alerta:
 * - "out"  → rojo  "Sin stock"   (stock = 0, aunque no haya umbral)
 * - "low"  → ámbar "Stock bajo"  (stock <= umbral configurado)
 * - "ok"   → no renderiza nada
 *
 * Spec: docs/extra/análisis-planes/spec-tecnicas.md.
 */
export function StockAlertBadge({
  stock,
  threshold,
  className,
}: StockAlertBadgeProps) {
  const status = getStockAlertStatus(stock, threshold);

  if (status === "ok") return null;

  const isOut = status === "out";

  return (
    <Badge
      variant="secondary"
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
