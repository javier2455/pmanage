"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SaleWithProductAndBusiness } from "@/lib/types/sales";
import { CancelSaleDialog } from "./cancel-sale-dialog";
import { PaymentDialog } from "./payment-dialog";
import { PaymentStatusBadge, resolvePaymentStatus } from "./payment-status-badge";
import { formatMoney, BASE_CURRENCY } from "@/lib/currency";

export type SalesColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies SalesColumnMeta;

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SalesSortableHeader({
  column,
  label,
  className,
}: {
  column: Column<SaleWithProductAndBusiness, unknown>;
  label: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "-ml-2 h-8 px-2 lg:-ml-4"}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  );
}

export function createSalesColumns(
  onCancelSale: (
    saleId: string,
    cancellationReason: string,
  ) => void | Promise<void>,
): ColumnDef<SaleWithProductAndBusiness>[] {
  return [
    {
      id: "fecha",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      meta: {
        headerClassName: "min-w-[180px] whitespace-nowrap",
        cellClassName: "min-w-[180px] whitespace-nowrap",
      } satisfies SalesColumnMeta,
      header: ({ column }) => (
        <SalesSortableHeader column={column} label="Fecha" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "productos",
      accessorFn: (row) => row.items.length,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SalesSortableHeader column={column} label="Productos" />
      ),
      cell: ({ row }) => {
        const count = row.original.items.length;
        return (
          <span className="text-sm tabular-nums text-foreground">
            {count > 0
              ? `${count} producto${count === 1 ? "" : "s"}`
              : "--"}
          </span>
        );
      },
    },
    {
      id: "total",
      accessorFn: (row) => Number(row.total),
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SalesSortableHeader column={column} label="Total" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums font-medium text-foreground">
          {formatMoney(
            Number(row.original.total),
            row.original.currency ?? BASE_CURRENCY,
          )}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (row) => (row.isCancelled ? "cancelled" : "active"),
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue) => {
        const v = filterValue as string | undefined;
        if (v == null || v === "" || v === "all") return true;
        if (v === "active") return !row.original.isCancelled;
        if (v === "cancelled") return row.original.isCancelled;
        return true;
      },
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SalesSortableHeader column={column} label="Estado" />
      ),
      cell: ({ row }) => (
        <PaymentStatusBadge status={resolvePaymentStatus(row.original)} />
      ),
    },
    {
      id: "actions",
      enableSorting: false,
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap",
      } satisfies SalesColumnMeta,
      header: () => (
        <div className="text-right font-medium text-foreground">Acciones</div>
      ),
      cell: ({ row }) => {
        if (row.original.isCancelled) return null;
        const status = resolvePaymentStatus(row.original);
        const canPay = status === "pending" || status === "partially_paid";
        return (
          <div className="flex justify-end gap-1">
            {canPay && (
              <PaymentDialog
                saleId={row.original.id}
                tooltip="Registrar pago"
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Registrar pago"
                    className="text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-600"
                  >
                    <Wallet className="size-4" />
                  </Button>
                }
              />
            )}
            <CancelSaleDialog
              tooltip="Cancelar venta"
              onConfirm={(cancellationReason) =>
                onCancelSale(row.original.id, cancellationReason)
              }
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Cancelar venta"
                  className="text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <XCircle className="size-4" />
                </Button>
              }
            />
          </div>
        );
      },
    },
  ];
}
