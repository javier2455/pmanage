"use client";

import type { ColumnMeta } from "@/components/data-table/column-meta";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BASE_CURRENCY, formatMoney } from "@/lib/currency";
import type { WorkerSalesItem } from "@/lib/types/analytics";

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap text-right",
  cellClassName: "w-[1%] whitespace-nowrap text-right",
} satisfies ColumnMeta;

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function ColumnInfoTooltip({ description }: { description: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Más información sobre esta columna"
            className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            onClick={(event) => event.stopPropagation()}
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-55 text-center">
          {description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SortableHeader({
  column,
  label,
  align = "left",
  tooltip,
}: {
  column: Column<WorkerSalesItem, unknown>;
  label: string;
  align?: "left" | "right";
  tooltip?: string;
}) {
  return (
    <div
      className={
        align === "right"
          ? "flex items-center justify-end gap-1"
          : "flex items-center gap-1"
      }
    >
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
      {tooltip ? <ColumnInfoTooltip description={tooltip} /> : null}
    </div>
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
      } satisfies ColumnMeta,
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
        <SortableHeader
          column={column}
          label="Ventas totales"
          align="right"
          tooltip={`Ventas completadas por el trabajador en el período, convertidas a ${BASE_CURRENCY} con las tasas del negocio. Debajo se detalla cuánto se vendió en cada moneda.`}
        />
      ),
      cell: ({ row }) => {
        const { totalSales, totalsByCurrency } = row.original;
        const breakdown = totalsByCurrency ?? [];
        // Con una sola moneda el desglose repetiría el consolidado, así que
        // solo se muestra cuando aporta información.
        const showBreakdown = breakdown.length > 1;

        return (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-medium tabular-nums text-foreground">
              {formatMoney(totalSales, BASE_CURRENCY)}
            </span>
            {showBreakdown
              ? breakdown.map((item) => (
                  <span
                    key={item.currency}
                    className="text-xs tabular-nums text-muted-foreground"
                  >
                    {formatMoney(item.total, item.currency)}
                  </span>
                ))
              : null}
          </div>
        );
      },
    },
    {
      id: "transactionCount",
      accessorFn: (row) => row.transactionCount,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SortableHeader
          column={column}
          label="Transacciones"
          align="right"
          tooltip="Cantidad de ventas completadas por el trabajador en el período seleccionado."
        />
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
        <SortableHeader
          column={column}
          label="Ticket promedio"
          align="right"
          tooltip={`Monto promedio por venta en ${BASE_CURRENCY}: las ventas totales consolidadas divididas entre el número de transacciones.`}
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {formatMoney(row.original.avgTicket, BASE_CURRENCY)}
        </span>
      ),
    },
    {
      id: "cancellationCount",
      accessorFn: (row) => row.cancellationCount,
      meta: compactColumnMeta,
      header: ({ column }) => (
        <SortableHeader
          column={column}
          label="Cancelaciones"
          align="right"
          tooltip="Número de ventas canceladas por el trabajador en el período seleccionado."
        />
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
        <SortableHeader
          column={column}
          label="Tasa de cancelación"
          align="right"
          tooltip="Porcentaje de cancelaciones respecto al total de ventas (completadas y canceladas) del trabajador."
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {formatPercent(row.original.cancellationRate)}
        </span>
      ),
    },
  ];
}
