"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Download, Loader2 } from "lucide-react";
import { usePrepareOffline, type ResourceStatus } from "@/hooks/use-prepare-offline";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Cuánto se sostiene el «listo» antes de desaparecer. */
const READY_NOTICE_MS = 5000;

/**
 * Qué se está guardando en el dispositivo para poder trabajar sin conexión.
 *
 * Solo aparece cuando hay algo que contar: mientras descarga, un momento al
 * terminar, o si algo falló. Con todo en orden desaparece — un indicador
 * permanente en verde se vuelve invisible a los dos días y deja de informar.
 *
 * Nombrar cada pieza mientras se descarga no es decoración: una barra genérica
 * en una conexión lenta parece que la aplicación se colgó. «Catálogo de
 * productos» dice que está trabajando y en qué.
 */
export function OfflineReadinessIndicator({ className }: { className?: string }) {
  const { isPreparing, isReady, resources, failedCount, retry } =
    usePrepareOffline();
  // El aviso de «listo» se retira solo. El estado lo cambia el temporizador, no
  // el efecto: escribirlo en el cuerpo del efecto provoca un render en cascada.
  const [readyNoticeDismissed, setReadyNoticeDismissed] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    const timer = setTimeout(() => setReadyNoticeDismissed(true), READY_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [isReady]);

  const showReady = isReady && !readyNoticeDismissed;

  const handleRetry = () => {
    setReadyNoticeDismissed(false);
    retry();
  };

  const hasProblem = failedCount > 0 && !isPreparing;
  if (!isPreparing && !hasProblem && !showReady) return null;

  const done = resources.filter((r) => r.status === "ready").length;
  const current = resources.find((r) => r.status === "loading");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            isPreparing
              ? `Preparando el modo sin conexión: ${current?.label ?? ""}`
              : hasProblem
                ? "No se pudo guardar todo para trabajar sin conexión"
                : "Listo para trabajar sin conexión"
          }
          aria-busy={isPreparing}
          className={cn(
            "relative",
            hasProblem
              ? "text-amber-700 dark:text-amber-400"
              : "text-muted-foreground",
            className,
          )}
        >
          {isPreparing ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : hasProblem ? (
            <AlertTriangle className="size-5" aria-hidden />
          ) : (
            <Download className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">
              {isPreparing
                ? "Preparando para trabajar sin conexión"
                : hasProblem
                  ? "Falta algo por guardar"
                  : "Listo para trabajar sin conexión"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isPreparing
                ? `Guardando en el dispositivo (${done} de ${resources.length})`
                : hasProblem
                  ? "Con lo que sí se guardó puedes seguir trabajando."
                  : "Tienes lo necesario para vender aunque se caiga la red."}
            </p>
          </div>

          <ul className="space-y-1.5">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="min-w-0 flex-1">{resource.label}</span>
                <StatusMark status={resource.status} />
              </li>
            ))}
          </ul>

          {hasProblem && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleRetry}
            >
              Reintentar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StatusMark({ status }: { status: ResourceStatus }) {
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
