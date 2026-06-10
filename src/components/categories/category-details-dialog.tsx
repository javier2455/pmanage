"use client";

import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CATEGORY_KINDS, type CategoryKind } from "./kind-config";

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CategoryDetailsDialogProps {
  kind: CategoryKind;
  categoryId: string;
  tooltip?: string;
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CategoryDetailsDialog({
  kind,
  categoryId,
  tooltip,
  trigger,
  open,
  onOpenChange,
}: CategoryDetailsDialogProps) {
  const config = CATEGORY_KINDS[kind];
  const { data, isLoading } = config.useById(
    open === false ? "" : categoryId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {tooltip ? (
          <span className="inline-flex">
            <Tooltip>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </span>
        ) : (
          trigger
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[520px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Detalles de la categoría
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col mt-4">
            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Nombre
              </span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                {data.name}
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Descripción
              </span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%] wrap-break-word">
                {data.description || "—"}
              </span>
            </div>

            {config.isBusinessScoped && (
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm font-medium text-card-foreground">
                  Negocio
                </span>
                <span className="text-sm font-medium text-card-foreground">
                  {(data as { business?: { name: string } }).business?.name ??
                    "—"}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Fecha de creación
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {formatDate(data.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between py-4">
              <span className="text-sm font-medium text-card-foreground">
                Última actualización
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {formatDate(data.updatedAt)}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
