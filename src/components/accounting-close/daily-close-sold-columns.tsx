"use client"

import type { ColumnMeta } from "@/components/data-table/column-meta";
import type { ColumnDef } from "@tanstack/react-table"
import type { SalesProductInfoResponse } from "@/lib/types/product"
import { currencyLabel } from "@/lib/currency"
import { formatQuantity } from "@/lib/units"
import { formatClosingCurrency } from "./format-closing-currency"
import { DailyCloseSortableHeader } from "./daily-close-sortable-header"
import {
  soldCurrencyCol,
  soldLineTotalCol,
  soldProductCol,
  soldQtyCol,
  soldUnitPriceCol,
} from "./daily-close-table-layout"

/**
 * Item de venta aplanado con la moneda de su venta padre adjunta. El item
 * (`SalesProductInfoResponse`) no lleva moneda: la moneda vive en la venta, así
 * que la propagamos al aplanar para poder mostrarla y agrupar por ella.
 */
export type SoldRow = SalesProductInfoResponse & { currency: string }

export const dailyCloseSoldColumns: ColumnDef<SoldRow>[] = [
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
      headerClassName: soldProductCol.headerClassName,
      cellClassName: `${soldProductCol.cellClassName} font-medium`,
    } satisfies ColumnMeta,
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
    id: "moneda",
    accessorFn: (row) => currencyLabel(row.currency),
    meta: {
      headerClassName: soldCurrencyCol.headerClassName,
      cellClassName: soldCurrencyCol.cellClassName,
    } satisfies ColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Moneda"
        className="-ml-2 h-8 justify-start px-2 lg:-ml-4"
      />
    ),
    cell: ({ row }) => (
      <span className="block text-muted-foreground">
        {currencyLabel(row.original.currency)}
      </span>
    ),
  },
  {
    id: "cantidad",
    accessorFn: (row) => Number(row.quantity),
    meta: {
      headerClassName: soldQtyCol.headerClassName,
      cellClassName: soldQtyCol.cellClassName,
    } satisfies ColumnMeta,
    header: ({ column }) => (
      <DailyCloseSortableHeader
        column={column}
        label="Cantidad"
        className="-mr-2 h-8 w-full justify-end px-2 lg:-mr-4 lg:pr-4"
      />
    ),
    cell: ({ row }) => (
      <span>
        {formatQuantity(row.original.quantity, row.original.product?.unit)}
      </span>
    ),
  },
  {
    id: "precio",
    accessorFn: (row) => Number(row.price),
    meta: {
      headerClassName: soldUnitPriceCol.headerClassName,
      cellClassName: soldUnitPriceCol.cellClassName,
    } satisfies ColumnMeta,
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
    accessorFn: (row) => Number(row.quantity) * Number(row.price),
    meta: {
      headerClassName: soldLineTotalCol.headerClassName,
      cellClassName: `${soldLineTotalCol.cellClassName} font-semibold`,
    } satisfies ColumnMeta,
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
