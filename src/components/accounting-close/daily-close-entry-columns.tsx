"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { InventoryEntry } from "@/lib/types/inventory"
import { formatClosingCurrency } from "./format-closing-currency"
import { DailyCloseSortableHeader } from "./daily-close-sortable-header"
import {
  dailyCloseLineTotalCol,
  dailyCloseProductCol,
  dailyCloseQtyCol,
  dailyCloseUnitPriceCol,
} from "./daily-close-table-layout"

export type DailyCloseEntryColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

function lineTotal(entry: InventoryEntry) {
  const qty = Number(entry.quantity)
  const unit = Number(entry.entryPrice)
  return qty * unit
}

export const dailyCloseEntryColumns: ColumnDef<InventoryEntry>[] = [
  {
    id: "product",
    accessorFn: (row) => row.product?.name?.trim() || "-",
    enableColumnFilter: true,
    filterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue ?? "").toLowerCase().trim()
      if (!q) return true
      const name = (row.original.product?.name || "").toLowerCase()
      return name.includes(q)
    },
    meta: {
      headerClassName: dailyCloseProductCol.headerClassName,
      cellClassName: `${dailyCloseProductCol.cellClassName} font-medium`,
    } satisfies DailyCloseEntryColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Producto"
        className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
      />
    ),
    cell: ({ row }) => (
      <span className="block font-medium text-foreground">
        {row.original.product?.name?.trim() || "-"}
      </span>
    ),
  },
  {
    id: "quantity",
    accessorFn: (row) => Number(row.quantity),
    meta: {
      headerClassName: dailyCloseQtyCol.headerClassName,
      cellClassName: dailyCloseQtyCol.cellClassName,
    } satisfies DailyCloseEntryColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Cantidad"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => <span>{Number(row.original.quantity)}</span>,
  },
  {
    id: "entryPrice",
    accessorFn: (row) => Number(row.entryPrice),
    meta: {
      headerClassName: dailyCloseUnitPriceCol.headerClassName,
      cellClassName: dailyCloseUnitPriceCol.cellClassName,
    } satisfies DailyCloseEntryColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Costo unit."
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>${formatClosingCurrency(Number(row.original.entryPrice))}</span>
    ),
  },
  {
    id: "lineTotal",
    accessorFn: (row) => lineTotal(row),
    meta: {
      headerClassName: dailyCloseLineTotalCol.headerClassName,
      cellClassName: `${dailyCloseLineTotalCol.cellClassName} font-semibold`,
    } satisfies DailyCloseEntryColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Total"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>${formatClosingCurrency(lineTotal(row.original))}</span>
    ),
  },
]
