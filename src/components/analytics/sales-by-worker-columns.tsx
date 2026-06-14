"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WorkerSalesItem } from "@/lib/types/analytics";

export type SalesByWorkerColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap text-right",
  cellClassName: "w-[1%] whitespace-nowrap text-right",
} satisfies SalesByWorkerColumnMeta;

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function SortableHeader({
  column,
  label,
  align = "left",
}: {
  column: Column<WorkerSalesItem, unknown>;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={
        align === "right"
          ? "-mr-2 ml-auto h-8 px-2 lg:-mr-4"
          : "-ml-2 h-8 px-2 lg:-ml-4"
      }
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  );
}

export function createSalesByWorkerColumns(): ColumnDef<WorkerSalesItem>[] {
  return [
    {
      id: "trabajador",
      accessorFn: (row) => row.workerName ?? row.workerEmail ?? "",
      meta: {
        headerClassName: "min-w-[220px]",
        cellClassName: "min-w-[220px]",
      } satisfies SalesByWorkerColumnMeta,
      header: ({ column }) => (
        <SortableHeader column={column} label="Trabajador" />
      ),
      cell: ({ row }) => {
        const worker = row.original;
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {worker.workerName || "Sin nombre"}
            </span>
            {worker.workerEmail ? (
              <span className="truncate text-xs text-muted-foreground">
                {worker.workerEmail}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "totalSales",
      accessorFn: (row) => row.totalSales,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SortableHeader column={column} label="Ventas totales" align="right" />
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums text-foreground">
          {formatCurrency(row.original.totalSales)}
        </span>
      ),
    },
    {
      id: "transactionCount",
      accessorFn: (row) => row.transactionCount,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SortableHeader column={column} label="Transacciones" align="right" />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {row.original.transactionCount.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      id: "avgTicket",
      accessorFn: (row) => row.avgTicket,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SortableHeader column={column} label="Ticket promedio" align="right" />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {formatCurrency(row.original.avgTicket)}
        </span>
      ),
    },
    {
      id: "cancellationCount",
      accessorFn: (row) => row.cancellationCount,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SortableHeader column={column} label="Cancelaciones" align="right" />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {row.original.cancellationCount.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      id: "cancellationRate",
      accessorFn: (row) => row.cancellationRate,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SortableHeader column={column} label="Tasa de cancelación" align="right" />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {formatPercent(row.original.cancellationRate)}
        </span>
      ),
    },
  ];
}
