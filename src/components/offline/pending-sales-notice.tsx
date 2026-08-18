"use client";

import { CloudUpload } from "lucide-react";
import { useBusiness } from "@/context/business-context";
import { useOutbox } from "@/hooks/use-outbox";

/**
 * Aviso de ventas guardadas en el dispositivo, sobre el listado de ventas.
 *
 * Existe porque el listado viene del servidor y una venta encolada todavía no
 * está allí: sin este aviso, quien acaba de registrarla mira la tabla, no la
 * encuentra y da por hecho que se perdió — que es justo lo contrario de lo que
 * pasó. Mezclarlas como filas de la tabla vendría después; mientras tanto, más
 * vale decirlo con todas las letras que fingir que la tabla lo cuenta todo.
 */
export function PendingSalesNotice() {
  const { activeBusinessId } = useBusiness();
  const { operations } = useOutbox(activeBusinessId ?? null);

  const pending = operations.filter(
    (op) => op.type === "sale.create" && op.status !== "done",
  );
  if (pending.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300">
      <div className="flex items-start gap-2">
        <CloudUpload className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0 space-y-1 text-sm">
          <p className="font-medium">
            {pending.length === 1
              ? "1 venta guardada en este dispositivo"
              : `${pending.length} ventas guardadas en este dispositivo`}
          </p>
          <p className="text-xs opacity-90">
            Todavía no están en el servidor, así que no aparecen en la tabla.
            Súbelas desde «Cambios sin subir», arriba a la derecha.
          </p>
          <ul className="space-y-0.5 text-xs">
            {pending.slice(0, 5).map((op) => (
              <li key={op.id}>· {op.label}</li>
            ))}
            {pending.length > 5 && (
              <li>· y {pending.length - 5} más</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
