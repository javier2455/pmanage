"use client";

import { useState } from "react";

import {
  AlertTriangle,
  Check,
  CloudCheck,
  CloudOff,
  CloudUpload,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { sileo } from "sileo";
import { useBusiness } from "@/context/business-context";
import { useConnectivity } from "@/hooks/use-connectivity";
import { useOutbox } from "@/hooks/use-outbox";
import { PendingChangesDialog } from "@/components/offline/pending-changes-dialog";
import { useAppShellStatus, type AppShellState } from "@/hooks/use-app-shell-status";
import { usePrepareOffline, type ResourceStatus } from "@/hooks/use-prepare-offline";
import { resolveStatusTone } from "@/lib/offline/status-tone";
import type { SyncRunResult } from "@/lib/offline/sync-runner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TOAST_STYLES } from "@/lib/toast-styles";
import { cn } from "@/lib/utils";

/**
 * Un único botón para todo lo relacionado con la red (plan offline, B7).
 *
 * Antes eran tres iconos separados —conexión, cambios sin subir y preparación
 * del dispositivo— y en móvil no cabían: se montaban sobre el selector de
 * negocio. Pero el problema de fondo no era el espacio: tres avisos distintos
 * sobre el mismo asunto obligan a la persona a recomponer mentalmente una sola
 * pregunta —«¿puedo trabajar y está a salvo lo que hice?»— a partir de tres
 * pistas sueltas.
 *
 * Ahora el icono resume el estado más urgente y el detalle vive dentro, en tres
 * bloques. El orden de urgencia está en `resolveStatusTone`, aparte y probado.
 */
export function OfflineStatusButton({ className }: { className?: string }) {
  const { activeBusinessId } = useBusiness();
  const { isOffline, isChecking, checkNow, lastOnlineAt } = useConnectivity();
  const { operations, counts, isSyncing, sync, retry, discard } = useOutbox(
    activeBusinessId ?? null,
  );
  const {
    isPreparing,
    isReady,
    resources,
    failedCount,
    retry: retryPrepare,
  } = usePrepareOffline();
  const appShell = useAppShellStatus();
  const [detailOpen, setDetailOpen] = useState(false);

  const tone = resolveStatusTone({
    isOffline,
    rejected: counts.rejected,
    unsynced: counts.unsynced,
    isPreparing,
    failedResources: failedCount,
  });

  const queue = operations.filter((op) => op.status !== "done");

  /**
   * El aviso solo aparece en los reintentos MANUALES. Los sondeos automáticos
   * (cada 5-60 s mientras no hay red) son silenciosos a propósito: un toast por
   * cada uno sería insoportable.
   */
  const handleCheckConnection = async () => {
    const reachable = await checkNow();
    sileo[reachable ? "success" : "info"]({
      title: reachable ? "Conexión restablecida" : "Sigue sin conexión",
      description: reachable
        ? "Ya puedes seguir trabajando con normalidad."
        : "El servidor no responde. Puedes seguir trabajando y reintentar " +
          "en un momento.",
      styles: TOAST_STYLES,
    });
  };

  const handleSync = async () => {
    const result = await sync();
    if (!result) return;
    if (!result.ran) {
      sileo.info({
        title: "Ya se está subiendo",
        description: "Otra pestaña está subiendo estos cambios ahora mismo.",
        styles: TOAST_STYLES,
      });
      return;
    }
    announce(result);
  };

  return (
    <>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={ARIA_LABEL[tone]}
          aria-busy={isPreparing || isSyncing}
          className={cn(
            "relative shrink-0",
            TONE_CLASS[tone],
            tone === "ready" && "opacity-50",
            className,
          )}
        >
          <ToneIcon tone={tone} />
          {counts.unsynced > 0 && (
            <span
              className={cn(
                "absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                counts.rejected > 0 ? "bg-red-600" : "bg-amber-500",
              )}
            >
              {counts.unsynced > 99 ? "99+" : counts.unsynced}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <ScrollArea className="max-h-[70vh]">
          <div className="divide-border divide-y">
            {/* ----------------------------------------------- conexión */}
            <section className="space-y-1 p-3">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <CloudOff
                    className="size-4 shrink-0 text-amber-600 dark:text-amber-400"
                    aria-hidden
                  />
                ) : (
                  <CloudCheck
                    className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                )}
                <p className="text-sm font-medium">
                  {isOffline ? "Sin conexión" : "Con conexión"}
                </p>
              </div>
              <p className="text-muted-foreground text-xs">
                {isOffline
                  ? // Decirlo importa: en un mostrador, dar por actual un stock
                    // de ayer lleva a vender algo que ya no está.
                    "Estás viendo datos guardados en el dispositivo."
                  : "Los datos que ves vienen del servidor."}
              </p>
              {isOffline && lastOnlineAt && (
                <p className="text-muted-foreground text-xs">
                  Última conexión:{" "}
                  {lastOnlineAt.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              {isOffline && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={() => void handleCheckConnection()}
                  disabled={isChecking}
                  aria-busy={isChecking}
                >
                  <RefreshCw
                    className={cn("size-3.5", isChecking && "animate-spin")}
                    aria-hidden
                  />
                  {isChecking ? "Comprobando…" : "Reintentar"}
                </Button>
              )}
            </section>

            {/* --------------------------------------- cambios sin subir */}
            <section className="space-y-2 p-3">
              <div>
                <p className="text-sm font-medium">Cambios sin subir</p>
                <p className="text-muted-foreground text-xs">
                  {counts.unsynced === 0
                    ? "Todo tu trabajo está en el servidor."
                    : "Guardados en este dispositivo hasta que los subas."}
                </p>
              </div>

              {/* El RESUMEN, no la lista. Una jornada sin conexión son
                  decenas de ventas, y una lista dentro de un desplegable crece
                  hasta tapar la pantalla que hay debajo. El número es lo que
                  se mira de reojo; el detalle se abre aparte cuando hace
                  falta. */}
              {queue.length > 0 && (
                <div className="space-y-0.5 text-xs">
                  <p className="tabular-nums">
                    <span className="font-medium">{queue.length}</span>{" "}
                    {queue.length === 1
                      ? "operación guardada aquí"
                      : "operaciones guardadas aquí"}
                  </p>
                  {counts.rejected > 0 && (
                    <p className="font-medium text-red-600 dark:text-red-400">
                      {counts.rejected}{" "}
                      {counts.rejected === 1
                        ? "rechazada: necesita tu decisión"
                        : "rechazadas: necesitan tu decisión"}
                    </p>
                  )}
                </div>
              )}

              {counts.unsynced > 0 && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={isSyncing}
                  aria-busy={isSyncing}
                  onClick={() => void handleSync()}
                >
                  <RefreshCw
                    className={cn("size-3.5", isSyncing && "animate-spin")}
                    aria-hidden
                  />
                  {isSyncing ? "Subiendo…" : `Subir cambios (${counts.unsynced})`}
                </Button>
              )}

              {queue.length > 0 && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setDetailOpen(true)}
                >
                  Ver todas
                </Button>
              )}
            </section>

            {/* -------------------------------- la aplicación en el equipo */}
            <section className="space-y-1 p-3">
              <p className="text-sm font-medium">La aplicación</p>
              <p className="text-muted-foreground text-xs">
                {APP_SHELL_TEXT[appShell.state]}
              </p>
              {appShell.state === "installing" && appShell.total > 0 && (
                <p className="text-muted-foreground text-xs tabular-nums">
                  {appShell.precached} de {appShell.total} archivos
                </p>
              )}
            </section>

            {/* ------------------------------------ datos del dispositivo */}
            {resources.length > 0 && (
              <section className="space-y-2 p-3">
                <div>
                  <p className="text-sm font-medium">
                    Datos guardados en el dispositivo
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isPreparing
                      ? "Guardando lo necesario para vender sin conexión…"
                      : isReady
                        ? "Tienes lo necesario para vender aunque se caiga la red."
                        : failedCount > 0
                          ? "Con lo que sí se guardó puedes seguir trabajando."
                          : "Se guardará en cuanto haya conexión."}
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {resources.map((resource) => (
                    <li
                      key={resource.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="min-w-0 flex-1">{resource.label}</span>
                      <ResourceMark status={resource.status} />
                    </li>
                  ))}
                </ul>

                {failedCount > 0 && !isPreparing && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={retryPrepare}
                  >
                    Reintentar descarga
                  </Button>
                )}
              </section>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>

    <PendingChangesDialog
      open={detailOpen}
      onOpenChange={setDetailOpen}
      operations={queue}
      onRetry={(seq) => void retry(seq)}
      onDiscard={(seq) => void discard(seq)}
    />
    </>
  );
}

/* ------------------------------------------------------------------ icono */

/**
 * Los datos guardados no sirven de nada si la aplicación no está guardada: sin
 * ella el navegador ni siquiera abre la pantalla y enseña su propio error, del
 * que no se puede volver. Por eso va antes que los datos.
 */
const APP_SHELL_TEXT: Record<AppShellState, string> = {
  ready: "Guardada en este dispositivo: abre y navega sin conexión.",
  installing:
    "Descargándose. Hasta que termine, sin conexión no llegaría a abrir.",
  absent:
    "NO está guardada. Sin conexión el navegador dará su propio error: " +
    "conéctate y recarga esta página para guardarla.",
  unknown: "Comprobando…",
};

const ARIA_LABEL: Record<ReturnType<typeof resolveStatusTone>, string> = {
  offline: "Sin conexión. Ver detalles",
  rejected: "Hay cambios rechazados. Ver detalles",
  pending: "Hay cambios sin subir. Ver detalles",
  preparing: "Preparando el modo sin conexión. Ver detalles",
  incomplete: "Falta algo por guardar en el dispositivo. Ver detalles",
  ready: "Todo al día. Ver estado de conexión y datos",
};

const TONE_CLASS: Record<ReturnType<typeof resolveStatusTone>, string> = {
  offline: "text-amber-700 dark:text-amber-400",
  rejected: "text-red-600 dark:text-red-400",
  pending: "text-amber-700 dark:text-amber-400",
  preparing: "text-muted-foreground",
  incomplete: "text-amber-700 dark:text-amber-400",
  ready: "text-emerald-600 dark:text-emerald-400",
};

function ToneIcon({ tone }: { tone: ReturnType<typeof resolveStatusTone> }) {
  if (tone === "offline") return <CloudOff className="size-5" aria-hidden />;
  if (tone === "preparing")
    return <Loader2 className="size-5 animate-spin" aria-hidden />;
  if (tone === "incomplete")
    return <AlertTriangle className="size-5" aria-hidden />;
  if (tone === "rejected" || tone === "pending")
    return <CloudUpload className="size-5" aria-hidden />;
  return <CloudCheck className="size-5" aria-hidden />;
}

/* ------------------------------------------------------------- etiquetas */

/* Las etiquetas de la cola viven ahora junto a la lista, en
   pending-changes-dialog.tsx. */

function ResourceMark({ status }: { status: ResourceStatus }) {
  if (status === "ready") {
    return (
      <span className="flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <Check className="size-3.5" aria-hidden />
        Guardado
      </span>
    );
  }
  if (status === "loading") {
    return (
      <span className="text-muted-foreground flex shrink-0 items-center gap-1">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Descargando…
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="shrink-0 text-amber-600 dark:text-amber-400">
        No se pudo
      </span>
    );
  }
  return <span className="text-muted-foreground shrink-0">En espera</span>;
}

/** Cuenta cómo fue la subida. Nunca se calla un rechazo. */
function announce(result: SyncRunResult) {
  const problems = result.rejected + result.failed;

  if (result.stoppedBy) {
    sileo.error({
      title:
        result.applied > 0
          ? `Se subieron ${result.applied}, pero quedó trabajo pendiente`
          : "No se pudieron subir los cambios",
      description: result.stoppedBy.message,
      styles: TOAST_STYLES,
    });
    return;
  }

  if (problems > 0) {
    sileo.error({
      title: `${result.applied} subidos · ${problems} con problemas`,
      description: "Abre el estado de conexión para ver qué dijo el servidor.",
      styles: TOAST_STYLES,
    });
    return;
  }

  sileo.success({
    title:
      result.applied === 1
        ? "Se subió 1 cambio"
        : `Se subieron ${result.applied} cambios`,
    description:
      result.duplicated > 0
        ? `${result.duplicated} ya estaban registrados en el servidor.`
        : "Todo tu trabajo está ya en el servidor.",
    styles: TOAST_STYLES,
  });
}
