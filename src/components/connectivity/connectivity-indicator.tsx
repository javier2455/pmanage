"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { sileo } from "sileo";
import { useConnectivity } from "@/hooks/use-connectivity";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Colores FIJOS, no tokens del tema.
 *
 * La hoja de estilos de sileo no tiene ninguna regla de modo oscuro (ni `.dark`
 * ni `prefers-color-scheme`): su superficie es siempre clara. Con tokens como
 * `text-foreground`, que en modo oscuro se vuelven casi blancos, el texto
 * desaparece sobre ese fondo claro — que es justo lo que pasaba primero con la
 * descripción y después con el título.
 */
const TOAST_STYLES = {
  title: "text-zinc-900! text-[16px]! font-bold!",
  description: "text-zinc-600! text-[15px]!",
} as const;

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
        styles: TOAST_STYLES,
      });
      return;
    }
    sileo.info({
      title: "Sigue sin conexión",
      description:
        "Lo intentamos de nuevo, pero el servidor no responde. Puedes seguir " +
        "trabajando y reintentar en un momento.",
      styles: TOAST_STYLES,
    });
  };

  if (!isOffline) return null;

  const lastConnectionLabel = lastOnlineAt
    ? `Última conexión: ${lastOnlineAt.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  const retryButton = (
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
  );

  return (
    <div role="status" aria-live="polite" className={className}>
      {/* Pantallas anchas: la tarjeta completa, con el estado siempre a la vista. */}
      <div className="hidden items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-amber-700 lg:flex dark:text-amber-400">
        <CloudOff className="size-4 shrink-0" aria-hidden />
        <div className="min-w-0 text-xs leading-tight">
          <p className="font-medium">Sin conexión</p>
          <p className="text-amber-700/80 dark:text-amber-400/80">
            {lastConnectionLabel ?? "Mostrando datos guardados"}
          </p>
        </div>
        {retryButton}
      </div>

      {/* Tablet y móvil: solo el icono. La tarjeta entera empujaba fuera de la
          pantalla los botones de guía y notificaciones. Se mantiene en el mismo
          sitio de la barra —el estado se busca donde están los estados— y el
          detalle se despliega al tocarlo. */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Sin conexión. Ver detalles y reintentar"
            className="relative text-amber-700 lg:hidden dark:text-amber-400"
          >
            <CloudOff className="size-5" aria-hidden />
            <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-amber-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <div className="flex items-start gap-2">
            <CloudOff
              className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">Sin conexión</p>
              {/* Decir que los datos son guardados no es un detalle menor: en
                  un POS, dar por actual un stock de ayer lleva a vender algo
                  que ya no está. */}
              <p className="text-muted-foreground text-xs leading-snug">
                Estás viendo datos guardados en el dispositivo. Se reintentará
                la conexión solo.
              </p>
              {lastConnectionLabel && (
                <p className="text-muted-foreground text-xs">
                  {lastConnectionLabel}
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 flex justify-end">{retryButton}</div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
