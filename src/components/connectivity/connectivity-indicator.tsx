"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useConnectivity } from "@/hooks/use-connectivity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Aviso de "sin conexión" en la barra superior del panel (plan offline, B0).
 *
 * Solo aparece cuando NO hay conexión: en el caso normal no ocupa espacio ni
 * añade ruido. Lo importante es que el cajero se entere ANTES de intentar
 * cobrar, no después de que la operación falle.
 *
 * El texto es deliberadamente tranquilizador. Cuando la cola local esté
 * implementada (B6), aquí se añadirá cuántas operaciones están pendientes de
 * subir; por ahora solo informa del estado.
 */
export function ConnectivityIndicator({ className }: { className?: string }) {
  const { isOffline, checkNow, lastOnlineAt } = useConnectivity();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-amber-700 dark:text-amber-400",
        className,
      )}
    >
      <CloudOff className="size-4 shrink-0" aria-hidden />
      <div className="min-w-0 text-xs leading-tight">
        <p className="font-medium">Sin conexión</p>
        {lastOnlineAt && (
          <p className="text-amber-700/80 dark:text-amber-400/80">
            Última conexión:{" "}
            {lastOnlineAt.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={checkNow}
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Reintentar
      </Button>
    </div>
  );
}
