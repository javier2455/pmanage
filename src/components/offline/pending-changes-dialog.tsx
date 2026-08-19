"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OutboxOp, OutboxStatus } from "@/lib/offline/outbox-types";
import { cn } from "@/lib/utils";

/**
 * La lista completa de lo que está guardado en el dispositivo sin subir.
 *
 * Vive en un diálogo y no dentro del aviso de red por una razón de tamaño: una
 * jornada sin conexión son decenas o cientos de ventas, y una lista que crece
 * sin tope dentro de un desplegable acaba tapando la pantalla que hay debajo.
 * En el aviso queda el número —que es lo que se mira de reojo— y aquí el
 * detalle, que solo se abre cuando hace falta.
 */

export const QUEUE_STATUS_LABEL: Record<OutboxStatus, string> = {
  pending: "Pendiente",
  inflight: "Subiendo…",
  done: "Subida",
  failed: "Se reintentará",
  rejected: "Rechazada",
};

export const QUEUE_STATUS_CLASS: Record<OutboxStatus, string> = {
  pending: "text-amber-600 dark:text-amber-400",
  inflight: "text-sky-600 dark:text-sky-400",
  done: "text-emerald-600 dark:text-emerald-400",
  failed: "text-amber-600 dark:text-amber-400",
  rejected: "text-red-600 dark:text-red-400",
};

interface PendingChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operations: OutboxOp[];
  onRetry: (seq: number) => void;
  onDiscard: (seq: number) => void;
}

export function PendingChangesDialog({
  open,
  onOpenChange,
  operations,
  onRetry,
  onDiscard,
}: PendingChangesDialogProps) {
  // Lo rechazado primero: es lo único que no se arregla solo y espera una
  // decisión. Dentro de cada grupo, lo más reciente arriba.
  const ordered = [...operations].sort((a, b) => {
    const weight = (op: OutboxOp) => (op.status === "rejected" ? 0 : 1);
    return weight(a) - weight(b) || b.createdAt - a.createdAt;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambios sin subir</DialogTitle>
          <DialogDescription>
            {operations.length === 1
              ? "1 operación guardada en este dispositivo."
              : `${operations.length} operaciones guardadas en este dispositivo.`}{" "}
            Se suben al servidor cuando hay conexión.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <ul className="divide-border divide-y">
            {ordered.map((op) => (
              <li key={op.id} className="py-3 text-sm first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words">{op.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(op.createdAt).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium",
                      QUEUE_STATUS_CLASS[op.status],
                    )}
                  >
                    {QUEUE_STATUS_LABEL[op.status]}
                  </span>
                </div>

                {/* El mensaje literal del servidor: «no hay stock de
                    Coca-Cola» se puede resolver; «error» no. */}
                {op.lastError && (
                  <p className="text-muted-foreground mt-1 text-xs break-words">
                    {op.lastError.message}
                  </p>
                )}

                {op.needsManualCheck && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Salió del dispositivo sin respuesta: comprueba que no esté
                    ya registrada antes de descartarla.
                  </p>
                )}

                {(op.status === "rejected" || op.status === "failed") &&
                  typeof op.seq === "number" && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onRetry(op.seq as number)}
                      >
                        Reintentar
                      </Button>
                      {/* Descartar solo aparece en lo rechazado: sobre algo que
                          todavía se va a reintentar sería tirar trabajo que aún
                          puede entrar solo. */}
                      {op.status === "rejected" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-600 dark:text-red-400"
                          onClick={() => onDiscard(op.seq as number)}
                        >
                          Descartar
                        </Button>
                      )}
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
