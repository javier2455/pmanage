"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BusinessWithProducts } from "@/lib/types/business"
import { formatClosingCurrency } from "./format-closing-currency"
import { DailyCloseSortableHeader } from "./daily-close-sortable-header"
import {
  dailyCloseLineTotalCol,
  dailyCloseProductCol,
  dailyCloseQtyCol,
  dailyCloseUnitPriceCol,
} from "./daily-close-table-layout"

export type DailyCloseStockColumnMeta = {
  headerClassName?: string
  cellClassName?: string
}

const LOW_STOCK_MAX = 10

export const dailyCloseStockColumns: ColumnDef<BusinessWithProducts>[] = [
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
      cellClassName: dailyCloseProductCol.cellClassName,
    } satisfies DailyCloseStockColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Producto"
        className="-ml-2 h-auto min-h-8 flex-wrap justify-start gap-1 whitespace-normal px-2 py-2 text-left lg:-ml-4"
      />
    ),
    cell: ({ row }) => {
      const isLow = row.original.stock <= LOW_STOCK_MAX
      return (
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <span className="min-w-0 flex-1 break-words font-medium text-foreground">
            {row.original.product?.name?.trim() || "-"}
          </span>
          {isLow ? (
            <Badge
              variant="secondary"
              className="shrink-0 text-[10px] px-1.5 py-0 border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              Bajo
            </Badge>
          ) : null}
        </div>
      )
    },
  },
  {
    id: "stock",
    accessorKey: "stock",
    meta: {
      headerClassName: dailyCloseQtyCol.headerClassName,
      cellClassName: dailyCloseQtyCol.cellClassName,
    } satisfies DailyCloseStockColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Stock"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => {
      const isLow = row.original.stock <= LOW_STOCK_MAX
      return (
        <span
          className={cn(
            "font-medium",
            isLow
              ? "text-amber-600 dark:text-amber-400"
              : "text-foreground",
          )}
        >
          {row.original.stock} uds
        </span>
      )
    },
  },
  {
    id: "price",
    accessorFn: (row) => Number(row.price),
    meta: {
      headerClassName: dailyCloseUnitPriceCol.headerClassName,
      cellClassName: dailyCloseUnitPriceCol.cellClassName,
    } satisfies DailyCloseStockColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Precio unit."
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>${formatClosingCurrency(Number(row.original.price))}</span>
    ),
  },
  {
    id: "lineTotal",
    accessorFn: (row) => row.stock * Number(row.price),
    meta: {
      headerClassName: dailyCloseLineTotalCol.headerClassName,
      cellClassName: `${dailyCloseLineTotalCol.cellClassName} font-semibold`,
    } satisfies DailyCloseStockColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Valor total"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>
        ${formatClosingCurrency(row.original.stock * Number(row.original.price))}
      </span>
    ),
  },
]
