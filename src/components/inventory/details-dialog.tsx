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
import { InventoryEntry } from "@/lib/types/inventory";

interface InventoryDetailsDialogProps {
  entry: InventoryEntry;
  tooltip?: string;
  trigger?: React.ReactNode;
}

function formatDateTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--";
  }
}

export default function InventoryDetailsDialog({
  entry,
  tooltip,
  trigger,
}: InventoryDetailsDialogProps) {
  const total =
    entry.quantity && entry.unitPrice
      ? Number(entry.quantity) * Number(entry.unitPrice)
      : null;

  const triggerContent = trigger ?? (
    <Button variant="outline">Ver detalles</Button>
  );

  return (
    <Dialog>
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
      <DialogContent className="sm:max-w-[425px] md:max-w-[520px] shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Resumen de entrada de inventario
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col mt-4">
          <div className="flex items-start justify-between border-b border-border py-4 first:pt-0">
            <span className="text-sm text-muted-foreground">Producto</span>
            <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
              {entry.product?.name ?? "--"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm text-muted-foreground">Cantidad</span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {entry.quantity ?? "--"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm text-muted-foreground">
              Precio unitario
            </span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {entry.unitPrice
                ? new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                  }).format(Number(entry.unitPrice))
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-sm font-semibold text-card-foreground tabular-nums">
              {total != null
                ? new Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                  }).format(total)
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm text-muted-foreground">
              Stock anterior
            </span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {entry.previousStock ?? "--"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm text-muted-foreground">Stock nuevo</span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {entry.newStock ?? "--"}
            </span>
          </div>
          <div className="flex items-start justify-between border-b border-border py-4">
            <span className="text-sm text-muted-foreground">Descripción</span>
            <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
              {entry.description || "--"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border py-4">
            <span className="text-sm text-muted-foreground">
              Fecha de creación
            </span>
            <span className="text-sm font-medium text-card-foreground tabular-nums">
              {formatDateTime(entry.createdAt)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
