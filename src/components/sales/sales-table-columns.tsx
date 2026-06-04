"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MoreHorizontal, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SaleWithProductAndBusiness } from "@/lib/types/sales";
import DetailsDialog from "./details-dialog";
import { CancelSaleDialog } from "./cancel-sale-dialog";
import { StatusBadge } from "../generic/status-badge";

export type SalesColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies SalesColumnMeta;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(value);
}

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
          {formatCurrency(Number(row.original.total))}
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
      cell: ({ row }) =>
        row.original.isCancelled ? (
          <StatusBadge text="Cancelada" />
        ) : (
          <StatusBadge text="Efectuada" />
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
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Abrir acciones"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-1">
              <DetailsDialog
                saleId={row.original.id}
                trigger={
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <Eye className="size-4 text-blue-500 dark:text-blue-400" />
                    Ver detalles
                  </button>
                }
              />
              <CancelSaleDialog
                onConfirm={(cancellationReason) =>
                  onCancelSale(row.original.id, cancellationReason)
                }
                trigger={
                  <button
                    type="button"
                    disabled={row.original.isCancelled}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm whitespace-nowrap transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                  >
                    <XCircle className="size-4 shrink-0 text-destructive" />
                    Cancelar venta
                  </button>
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      ),
    },
  ];
}
