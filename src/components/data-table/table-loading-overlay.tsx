import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Capa de "Cargando…" que cubre una tabla o una lista mientras refresca datos
 * (cambio de página, de filtro…). El contenedor que la envuelve tiene que ser
 * `relative`. `className` permite ajustar la posición del aviso: las listas
 * largas lo anclan arriba (`items-start pt-8`) para que no quede fuera de vista.
 */
export function TableLoadingOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Cargando…</span>
      </div>
    </div>
  );
}
