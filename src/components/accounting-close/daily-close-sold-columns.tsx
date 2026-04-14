"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { SaleWithProductAndBusiness } from "@/lib/types/sales"
import { formatClosingCurrency } from "./format-closing-currency"
import { DailyCloseSortableHeader } from "./daily-close-sortable-header"
import {
  dailyCloseLineTotalCol,
  dailyCloseProductCol,
  dailyCloseQtyCol,
} from "./daily-close-table-layout"

export type DailyCloseSoldColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

export const dailyCloseSoldColumns: ColumnDef<SaleWithProductAndBusiness>[] = [
  {
    id: "fecha",
    accessorFn: (row) => new Date(row.createdAt).getTime(),
    meta: {
      headerClassName: dailyCloseProductCol.headerClassName,
      cellClassName: `${dailyCloseProductCol.cellClassName} font-medium`,
    } satisfies DailyCloseSoldColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Fecha"
        className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
      />
    ),
    cell: ({ row }) => (
      <span className="block font-medium text-foreground">
        {new Date(row.original.createdAt).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    id: "productos",
    accessorFn: (row) => row.items.length,
    meta: {
      headerClassName: dailyCloseQtyCol.headerClassName,
      cellClassName: dailyCloseQtyCol.cellClassName,
    } satisfies DailyCloseSoldColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Productos"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => {
      const count = row.original.items.length
      return (
        <span>
          {count > 0 ? `${count} producto${count === 1 ? "" : "s"}` : "--"}
        </span>
      )
    },
  },
  {
    id: "total",
    accessorFn: (row) => Number(row.total),
    meta: {
      headerClassName: dailyCloseLineTotalCol.headerClassName,
      cellClassName: `${dailyCloseLineTotalCol.cellClassName} font-semibold`,
    } satisfies DailyCloseSoldColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Total"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>${formatClosingCurrency(Number(row.original.total))}</span>
    ),
  },
]
