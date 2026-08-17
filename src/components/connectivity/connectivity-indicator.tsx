"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { sileo } from "sileo";
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
  const { isOffline, isChecking, checkNow, lastOnlineAt } = useConnectivity();

  /**
   * El aviso solo se muestra en los reintentos MANUALES. Los sondeos
   * automáticos (cada 5-60s mientras no hay red) son silenciosos a propósito:
   * un toast por cada uno sería insoportable.
   */
  const handleRetry = async () => {
    const reachable = await checkNow();
    if (reachable) {
      sileo.success({
        title: "Conexión restablecida",
        description: "Ya puedes seguir trabajando con normalidad.",
      });
      return;
    }
    sileo.info({
      title: "Sigue sin conexión",
      description:
        "Lo intentamos de nuevo, pero el servidor no responde. Puedes seguir " +
        "trabajando y reintentar en un momento.",
    });
  };

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
        onClick={() => void handleRetry()}
        disabled={isChecking}
        aria-busy={isChecking}
      >
        <RefreshCw
          className={cn("size-3.5", isChecking && "animate-spin")}
          aria-hidden
        />
        {isChecking ? "Comprobando…" : "Reintentar"}
      </Button>
    </div>
  );
}
