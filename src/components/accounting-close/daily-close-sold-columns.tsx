"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { SalesProductInfoResponse } from "@/lib/types/product"
import { formatClosingCurrency } from "./format-closing-currency"
import { DailyCloseSortableHeader } from "./daily-close-sortable-header"
import {
  dailyCloseLineTotalCol,
  dailyCloseProductCol,
  dailyCloseQtyCol,
  dailyCloseUnitPriceCol,
} from "./daily-close-table-layout"

export type DailyCloseSoldColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

export const dailyCloseSoldColumns: ColumnDef<SalesProductInfoResponse>[] = [
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
    } satisfies DailyCloseSoldColumnMeta,
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
    id: "cantidad",
    accessorFn: (row) => Number(row.cantidad),
    meta: {
      headerClassName: dailyCloseQtyCol.headerClassName,
      cellClassName: dailyCloseQtyCol.cellClassName,
    } satisfies DailyCloseSoldColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Cantidad"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => <span>{Number(row.original.cantidad)}</span>,
  },
  {
    id: "precio",
    accessorFn: (row) => Number(row.precio),
    meta: {
      headerClassName: dailyCloseUnitPriceCol.headerClassName,
      cellClassName: dailyCloseUnitPriceCol.cellClassName,
    } satisfies DailyCloseSoldColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Precio unit."
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>${formatClosingCurrency(Number(row.original.precio))}</span>
    ),
  },
  {
    id: "lineTotal",
    accessorFn: (row) => Number(row.cantidad) * Number(row.precio),
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
    cell: ({ getValue }) => (
      <span>${formatClosingCurrency(Number(getValue()))}</span>
    ),
  },
]
