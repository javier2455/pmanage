"use client";

import { AlertTriangle, PackageX } from "lucide-react";
import type { StockAlert } from "@/lib/types/inventory";

interface LowStockAlertBannerProps {
  alerts: StockAlert[];
}

/**
 * Resumen de productos en alerta sobre la tabla de inventario.
 * Se nutre de `useStockAlerts` (feature Pro). No renderiza nada si no hay
 * productos por debajo de su umbral.
 */
export function LowStockAlertBanner({ alerts }: LowStockAlertBannerProps) {
  const low = alerts.filter((a) => a.isLow);
  if (low.length === 0) return null;

  const outOfStock = low.filter((a) => a.stock <= 0);
  const running = low.filter((a) => a.stock > 0);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">
          {low.length} producto{low.length === 1 ? "" : "s"} necesita
          {low.length === 1 ? "" : "n"} atención
        </p>
      </div>
      <ul className="ml-6 flex flex-col gap-1 text-sm">
        {outOfStock.length > 0 && (
          <li className="flex items-center gap-1.5">
            <PackageX className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span>
              <span className="font-semibold">{outOfStock.length}</span> agotado
              {outOfStock.length === 1 ? "" : "s"} (sin stock)
            </span>
          </li>
        )}
        {running.length > 0 && (
          <li className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-semibold">{running.length}</span> por debajo
              del umbral configurado
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
