"use client";

import { AlertTriangle, Check, CloudCheck, Download, Loader2 } from "lucide-react";
import { usePrepareOffline, type ResourceStatus } from "@/hooks/use-prepare-offline";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Qué se está guardando en el dispositivo para poder trabajar sin conexión.
 *
 * **Siempre visible**, atenuado cuando todo está en orden. La primera versión
 * solo aparecía mientras descargaba y unos segundos al terminar; con las
 * consultas ya en memoria eso es un parpadeo en una esquina con otros cuatro
 * iconos, imposible de ver — y, peor, no dejaba comprobar el estado cuando a
 * uno le interesa. «¿Puedo irme al mercado con esto?» es una pregunta que se
 * hace ANTES de perder la señal, y necesita un sitio fijo donde mirar.
 *
 * Nombrar cada pieza mientras se descarga no es decoración: una barra genérica
 * en una conexión lenta parece que la aplicación se colgó. «Catálogo de
 * productos» dice que está trabajando y en qué.
 */
export function OfflineReadinessIndicator({ className }: { className?: string }) {
  const { isPreparing, isReady, resources, failedCount, retry } =
    usePrepareOffline();

  const hasProblem = failedCount > 0 && !isPreparing;
  if (resources.length === 0) return null;

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
            // Con todo guardado se atenúa, como el botón de cambios sin subir:
            // sigue ahí para consultarlo, sin competir por la atención.
            isReady && !isPreparing && "opacity-50",
            className,
          )}
        >
          {isPreparing ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : hasProblem ? (
            <AlertTriangle className="size-5" aria-hidden />
          ) : isReady ? (
            <CloudCheck
              className="size-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
          ) : (
            <Download className="size-5" aria-hidden />
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
                  : isReady
                    ? "Listo para trabajar sin conexión"
                    : "Aún sin preparar"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isPreparing
                ? `${current?.label ?? "Guardando"} (${done} de ${resources.length})`
                : hasProblem
                  ? "Con lo que sí se guardó puedes seguir trabajando."
                  : isReady
                    ? "Tienes lo necesario para vender aunque se caiga la red."
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
              onClick={retry}
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
