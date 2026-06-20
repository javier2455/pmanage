"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useDownloadFacturaMutation,
  useGetSaleById,
  useRegenerateFacturaMutation,
} from "@/hooks/use-sales";
import { FileText, Loader2, RefreshCw, Wallet } from "lucide-react";
import { ProductImage } from "@/components/products/product-image";
import { formatMoney, BASE_CURRENCY } from "@/lib/currency";
import { openPdfInNewTab } from "@/lib/download";
import { toastError } from "@/lib/toast";
import { PaymentStatusBadge, resolvePaymentStatus } from "./payment-status-badge";
import { PaymentDialog } from "./payment-dialog";

interface DetailsDialogProps {
  saleId: string;
  tooltip?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function DetailsDialog({
  saleId,
  tooltip,
  trigger,
  open,
  onOpenChange,
}: DetailsDialogProps) {
  const { data, isLoading } = useGetSaleById(saleId);
  const isControlled = open !== undefined;
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const downloadFactura = useDownloadFacturaMutation();
  const regenerateFactura = useRegenerateFacturaMutation();

  function handleVerFactura() {
    downloadFactura.mutate(saleId, {
      onSuccess: (blob) => openPdfInNewTab(blob, `factura-${saleId}.pdf`),
      onError: () =>
        toastError({
          title: "No se pudo abrir la factura",
          description:
            "La venta debe estar completamente pagada para generar la factura.",
        }),
    });
  }

  function handleRegenerarFactura() {
    regenerateFactura.mutate(saleId, {
      onSuccess: (blob) => openPdfInNewTab(blob, `factura-${saleId}.pdf`),
      onError: () =>
        toastError({
          title: "No se pudo regenerar la factura",
          description: "Inténtalo de nuevo en unos momentos.",
        }),
    });
  }

  const triggerContent = trigger ?? (
    <Button variant="outline">Ver detalles</Button>
  );

  const currency = data?.currency ?? BASE_CURRENCY;
  const total = Number(data?.total ?? 0);
  const totalPaid = Number(data?.totalPaid ?? 0);
  const pendiente = Math.max(total - totalPaid, 0);
  const items = data?.items ?? [];
  const status = resolvePaymentStatus({
    isCancelled: data?.isCancelled,
    paymentStatus: data?.paymentStatus,
  });
  const canPay = status === "pending" || status === "partially_paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {isControlled ? null : (
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
      )}
      <DialogContent className="flex max-h-[min(90vh,100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 shadow-lg shadow-cyan-300/30 sm:max-w-[425px] md:max-w-[520px]">
        <DialogHeader className="shrink-0 gap-3 border-b border-border p-6">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-card-foreground">
              Resumen de venta
            </DialogTitle>
            <PaymentStatusBadge status={status} />
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto px-6">
            {/* Items */}
            {items.length > 0 ? (
              <div className="flex flex-col border-b border-border py-4">
                <span className="mb-2 text-sm font-medium text-card-foreground">
                  Productos ({items.length})
                </span>
                <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
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
                            {Number(item.quantity)} x{" "}
                            {formatMoney(Number(item.price), currency)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="text-sm font-medium tabular-nums text-card-foreground">
                          {formatMoney(
                            Number(item.quantity) * Number(item.price),
                            currency,
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
                {formatMoney(total, currency)}
              </span>
            </div>

            {/* Descripción */}
            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm text-muted-foreground">Descripción</span>
              <span className="max-w-[55%] text-right text-sm font-medium text-card-foreground">
                {data?.descripcion || "--"}
              </span>
            </div>

            {/* Razón de cancelación */}
            {data?.isCancelled && (
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm text-muted-foreground">
                  Razón de cancelación
                </span>
                <span className="text-sm font-medium tabular-nums text-card-foreground">
                  {data?.cancelledReason || "--"}
                </span>
              </div>
            )}

            {/* Usuario */}
            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm text-muted-foreground">
                Registrado por
              </span>
              <span className="text-sm font-medium text-card-foreground">
                {data?.userName || "--"}
              </span>
            </div>

            {/* Fecha */}
            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">
                Fecha de creación
              </span>
              <span className="text-sm font-medium tabular-nums text-card-foreground">
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

        {/* Footer fijo: estado de pago + acción */}
        {!isLoading && !data?.isCancelled && (
          <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border p-6 sm:flex-col">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pagado</span>
              <span className="font-semibold tabular-nums text-emerald-600">
                {formatMoney(totalPaid, currency)}
              </span>
            </div>
            {pendiente > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pendiente</span>
                <span className="font-semibold tabular-nums text-amber-600">
                  {formatMoney(pendiente, currency)}
                </span>
              </div>
            )}
            {canPay ? (
              <Button
                type="button"
                onClick={() => setPaymentOpen(true)}
                className="w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
              >
                <Wallet className="mr-2 size-4" />
                Registrar pago
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleVerFactura}
                  disabled={downloadFactura.isPending}
                  className="w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {downloadFactura.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 size-4" />
                  )}
                  {downloadFactura.isPending
                    ? "Generando factura..."
                    : "Ver factura"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerarFactura}
                  disabled={regenerateFactura.isPending}
                  className="w-full"
                >
                  {regenerateFactura.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  {regenerateFactura.isPending
                    ? "Regenerando..."
                    : "Regenerar factura"}
                </Button>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>

      {/* Dialog de cobro, controlado desde el footer */}
      <PaymentDialog
        saleId={saleId}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </Dialog>
  );
}
