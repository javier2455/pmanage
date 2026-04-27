"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useGetExpenseByIdQuery } from "@/hooks/use-expenses";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ExpenseDetailsDialogProps {
  expenseId: string;
  tooltip?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ExpenseDetailsDialog({
  expenseId,
  tooltip,
  trigger,
  open,
  onOpenChange,
}: ExpenseDetailsDialogProps) {
  const { data, isLoading } = useGetExpenseByIdQuery(
    open === false ? "" : expenseId,
  );

  const triggerContent = trigger ?? (
    <Button variant="outline">Ver detalles</Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {tooltip ? (
          <span className="inline-flex">
            <Tooltip>
              <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </span>
        ) : (
          triggerContent
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[520px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Detalles del gasto
          </DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col mt-4">
            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">Título</span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                {data.title}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Monto
              </span>
              <span className="text-sm font-semibold tabular-nums text-card-foreground">
                {formatCurrency(Number(data.amount))}
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">Descripción</span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%] wrap-break-word">
                {data.description || "--"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">Registrado por</span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {data.createdBy || "--"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">Fecha de creación</span>
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
