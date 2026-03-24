"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InventoryEntry } from "@/lib/types/inventory";
import InventoryDetailsDialog from "./details-dialog";

/** Passed through to TableHead / TableCell in `table-of-inventory.tsx`. */
export type InventoryColumnMeta = {
  headerClassName?: string;
  cellClassName?: string;
};

/** Keeps numeric / date / action columns narrow so "Producto" can use remaining width on mobile. */
const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap",
} satisfies InventoryColumnMeta;

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(Number(value));
}

function InventorySortableHeader({
  column,
  label,
  className,
}: {
  column: Column<InventoryEntry, unknown>;
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

export const inventoryColumns: ColumnDef<InventoryEntry>[] = [
  {
    id: "product",
    accessorFn: (row) => row.product.name,
    enableColumnFilter: true,
    filterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").toLowerCase().trim();
      if (!q) return true;
      const name = row.original.product?.name ?? "";
      return name.toLowerCase().includes(q);
    },
    meta: {
      headerClassName:
        "min-w-[280px] max-w-none whitespace-normal align-top sm:max-w-[min(18rem,40vw)]",
      cellClassName:
        "min-w-[280px] max-w-none whitespace-normal break-words align-top sm:max-w-[min(18rem,40vw)]",
    } satisfies InventoryColumnMeta,
    header: ({ column }) => (
      <InventorySortableHeader
        column={column}
        label="Producto"
        className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
      />
    ),
    cell: ({ row }) => (
      <span className="block font-medium text-foreground">
        {row.original.product.name}
      </span>
    ),
  },
  {
    id: "quantity",
    accessorFn: (row) => Number(row.quantity),
    meta: compactColumnMeta,
    header: ({ column }) => (
      <InventorySortableHeader column={column} label="Cantidad" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">{row.original.quantity}</span>
    ),
  },
  {
    id: "unitPrice",
    accessorFn: (row) => Number(row.unitPrice),
    meta: compactColumnMeta,
    header: ({ column }) => (
      <InventorySortableHeader column={column} label="Precio unitario" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {formatCurrency(row.original.unitPrice)}
      </span>
    ),
  },
  {
    id: "previousStock",
    accessorFn: (row) => Number(row.previousStock),
    meta: compactColumnMeta,
    header: ({ column }) => (
      <InventorySortableHeader column={column} label="Stock anterior" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {row.original.previousStock}
      </span>
    ),
  },
  {
    id: "newStock",
    accessorFn: (row) => Number(row.newStock),
    meta: compactColumnMeta,
    header: ({ column }) => (
      <InventorySortableHeader column={column} label="Stock nuevo" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-foreground">
        {row.original.newStock}
      </span>
    ),
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    meta: compactColumnMeta,
    header: ({ column }) => (
      <InventorySortableHeader column={column} label="Fecha" />
    ),
    cell: ({ row }) => (
      <span className="text-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    enableSorting: false,
    meta: {
      headerClassName: "w-[1%] whitespace-nowrap text-right",
      cellClassName: "w-[1%] whitespace-nowrap",
    } satisfies InventoryColumnMeta,
    header: () => (
      <div className="text-right font-medium text-foreground">Acciones</div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-end">
        <InventoryDetailsDialog
          entry={row.original}
          tooltip="Detalles"
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Ver detalles"
            >
              <Eye />
            </Button>
          }
        />
      </div>
    ),
  },
];
