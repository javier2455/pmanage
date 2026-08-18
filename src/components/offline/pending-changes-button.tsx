"use client";

import { CloudUpload, RefreshCw } from "lucide-react";
import { sileo } from "sileo";
import { useBusiness } from "@/context/business-context";
import { useOutbox } from "@/hooks/use-outbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TOAST_STYLES } from "@/lib/toast-styles";
import type { OutboxOp, OutboxStatus } from "@/lib/offline/outbox-types";
import type { SyncRunResult } from "@/lib/offline/sync-runner";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<OutboxStatus, string> = {
  pending: "Pendiente",
  inflight: "Subiendo…",
  done: "Subida",
  failed: "Se reintentará",
  rejected: "Rechazada",
};

const STATUS_CLASS: Record<OutboxStatus, string> = {
  pending: "text-amber-600 dark:text-amber-400",
  inflight: "text-sky-600 dark:text-sky-400",
  done: "text-emerald-600 dark:text-emerald-400",
  failed: "text-amber-600 dark:text-amber-400",
  rejected: "text-red-600 dark:text-red-400",
};

/**
 * Botón de "Cambios sin subir" (plan offline, B6/B7).
 *
 * Está SIEMPRE en la barra, también cuando no hay nada pendiente. Un contador
 * que aparece y desaparece se aprende como decoración; uno que está siempre en
 * el mismo sitio se convierte en el lugar donde se mira antes de cerrar el
 * negocio, que es exactamente para lo que sirve.
 *
 * La subida es manual a propósito (plan offline, B7): al subir pueden aparecer
 * rechazos que exigen una decisión —una venta sin stock, un precio que
 * cambió—, y esa conversación no puede ocurrir mientras se atiende a alguien.
 * La opción de subir automáticamente llega con el panel completo.
 */
export function PendingChangesButton({ className }: { className?: string }) {
  const { activeBusinessId } = useBusiness();
  const { operations, counts, isSyncing, sync, retry } = useOutbox(
    activeBusinessId ?? null,
  );

  const unsynced = counts.unsynced;
  const queue = operations.filter((op) => op.status !== "done");

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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            unsynced > 0
              ? `${unsynced} cambios sin subir`
              : "Cambios sin subir: ninguno"
          }
          className={cn("relative", unsynced === 0 && "opacity-50", className)}
        >
          <CloudUpload className="size-5" aria-hidden />
          {unsynced > 0 && (
            <span
              className={cn(
                "absolute -end-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white",
                counts.rejected > 0 ? "bg-red-600" : "bg-amber-500",
              )}
            >
              {unsynced > 99 ? "99+" : unsynced}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Cambios sin subir</p>
            <p className="text-muted-foreground text-xs">
              {unsynced === 0
                ? "Todo tu trabajo está en el servidor."
                : "Guardados en este dispositivo hasta que los subas."}
            </p>
          </div>

          {queue.length > 0 && (
            <ScrollArea className="max-h-56">
              <ul className="space-y-2 pe-2">
                {queue.map((op) => (
                  <li key={op.id} className="text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 break-words">
                        {op.label}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-medium",
                          STATUS_CLASS[op.status],
                        )}
                      >
                        {STATUS_LABEL[op.status]}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{formatMoment(op)}</p>
                    {/* El mensaje literal del servidor: "no hay stock de
                        Coca-Cola" se puede resolver; "error al sincronizar" no. */}
                    {op.lastError && (
                      <p className="text-muted-foreground mt-0.5 break-words">
                        {op.lastError.message}
                      </p>
                    )}
                    {(op.status === "rejected" || op.status === "failed") &&
                      typeof op.seq === "number" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 px-2 text-xs"
                          onClick={() => void retry(op.seq as number)}
                        >
                          Reintentar
                        </Button>
                      )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}

          <Button
            type="button"
            size="sm"
            className="w-full"
            disabled={unsynced === 0 || isSyncing}
            aria-busy={isSyncing}
            onClick={() => void handleSync()}
          >
            <RefreshCw
              className={cn("size-3.5", isSyncing && "animate-spin")}
              aria-hidden
            />
            {isSyncing ? "Subiendo…" : `Subir cambios (${unsynced})`}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
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
      description:
        "Abre «Cambios sin subir» para ver qué dijo el servidor de cada uno.",
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

function formatMoment(op: OutboxOp): string {
  const date = new Date(op.occurredAt);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
