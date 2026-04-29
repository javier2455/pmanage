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
import { useGetSaleById } from "@/hooks/use-sales";
import { Loader2 } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(value);
}

interface DetailsDialogProps {
  saleId: string;
  tooltip?: string;
  trigger?: React.ReactNode;
}

export default function DetailsDialog({
  saleId,
  tooltip,
  trigger,
}: DetailsDialogProps) {
  const { data, isLoading } = useGetSaleById(saleId);

  console.log("Details of dialog", data);
  const triggerContent = trigger ?? (
    <Button variant="outline">Open Dialog</Button>
  );

  const total = Number(data?.total ?? 0);
  const items = data?.items ?? [];

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
      <DialogContent className="sm:max-w-[425px] md:max-w-[520px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Resumen de venta
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col mt-4">
            {/* Items */}
            {items.length > 0 ? (
              <div className="flex flex-col border-b border-border pb-2">
                <span className="text-sm font-medium text-card-foreground mb-2">
                  Productos ({items.length})
                </span>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex min-w-0 items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2 ${item.isCancelled ? "opacity-60" : ""}`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <ProductImage
                          src={item.product?.imageUrl}
                          alt={item.product?.name ?? "Producto"}
                          size="sm"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="line-clamp-2 wrap-break-word text-sm text-card-foreground max-w-[85%]">
                            {item.product?.name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {Number(item.cantidad)} x{" "}
                            {formatCurrency(Number(item.precio))}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-sm font-medium tabular-nums text-card-foreground">
                          {formatCurrency(
                            Number(item.cantidad) * Number(item.precio),
                          )}
                        </span>
                        {item.isCancelled && (
                          <span className="text-xs text-destructive">
                            Cancelado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm text-muted-foreground">Productos</span>
                <span className="text-sm text-muted-foreground">--</span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm font-medium text-card-foreground">
                Total
              </span>
              <span className="text-sm font-semibold tabular-nums text-card-foreground">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Descripción */}
            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm text-muted-foreground">Descripción</span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
                {data?.descripcion || "--"}
              </span>
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span
                className={`text-sm font-medium tabular-nums ${data?.isCancelled ? "text-destructive" : "text-primary"}`}
              >
                {data?.isCancelled ? "Cancelada" : "Efectuada"}
              </span>
            </div>

            {/* Razón de cancelación */}
            {data?.isCancelled && (
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm text-muted-foreground">
                  Razón de cancelación
                </span>
                <span className="text-sm font-medium text-card-foreground tabular-nums">
                  {data?.cancelledReason || "--"}
                </span>
              </div>
            )}

            {/* Fecha */}
            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">
                Fecha de creación
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {data?.createdAt
                  ? new Date(data.createdAt).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--"}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
