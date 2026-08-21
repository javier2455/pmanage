"use client"

import * as React from "react"
import { columnMeta } from "@/components/data-table/column-meta";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { Search, Warehouse } from "lucide-react"
import type { BusinessWithProducts } from "@/lib/types/business"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav"
import { formatClosingCurrency } from "./format-closing-currency"
import {
  dailyCloseStockColumns,
} from "./daily-close-stock-columns"

interface DailyCloseStockTableProps {
  lines: BusinessWithProducts[]
  /**
   * Valor del inventario al costo de entrada, en CUP, calculado por el backend.
   * `null` cuando la respuesta no lo trae: se muestra un guion en vez de una
   * cifra, porque el dato no es derivable en el cliente (aquí solo llega el
   * precio de venta, y valorar el almacén con él lo infla por el margen).
   */
  totalStockValue: number | null
}

export function DailyCloseStockTable({
  lines,
  totalStockValue,
}: DailyCloseStockTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [lines])

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [columnFilters])

  const table = useReactTable({
    data: lines,
    columns: dailyCloseStockColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  const pageCount = table.getPageCount()
  const maxPageIndex = Math.max(0, pageCount - 1)
  React.useEffect(() => {
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((p) => ({ ...p, pageIndex: maxPageIndex }))
    }
  }, [maxPageIndex, pagination.pageIndex])

  const productColumn = table.getColumn("product")
  const productFilterValue = String(productColumn?.getFilterValue() ?? "")
  const filteredTotal = table.getFilteredRowModel().rows.length
  const hasProductFilter = productFilterValue.trim().length > 0

  function clearProductFilter() {
    productColumn?.setFilterValue(undefined)
  }

  return (
    <CardContent className="flex min-h-0 flex-col gap-0 p-0">
      <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full max-w-md flex-col gap-1.5">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="daily-close-stock-search"
          >
            Buscar producto
          </label>
          <Input
            id="daily-close-stock-search"
            type="search"
            placeholder="Nombre del producto…"
            value={productFilterValue}
            onChange={(e) =>
              productColumn?.setFilterValue(
                e.target.value.length ? e.target.value : undefined,
              )
            }
            aria-controls="daily-close-stock-table"
            disabled={lines.length === 0}
          />
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="px-4 pb-6 pt-4">
          <Empty className="border-border border bg-muted/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Warehouse />
              </EmptyMedia>
              <EmptyTitle>Sin productos en almacén</EmptyTitle>
              <EmptyDescription>
                Este negocio no tiene productos asignados todavía.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : filteredTotal === 0 ? (
        <div className="px-4 pb-6 pt-4">
          <Empty className="border-border border bg-muted/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>Sin resultados</EmptyTitle>
              <EmptyDescription>
                No hay productos que coincidan con «{productFilterValue.trim()}».
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearProductFilter}
              >
                Limpiar búsqueda
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table
            id="daily-close-stock-table"
            className="w-full min-w-xl table-fixed"
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-4 py-3 text-foreground",
                        columnMeta(header.column).headerClassName,
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "px-4 py-3 text-foreground",
                        columnMeta(cell.column).cellClassName,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {hasProductFilter ? (
            <>
              <span className="font-medium text-foreground">
                {filteredTotal}
              </span>{" "}
              línea{filteredTotal === 1 ? "" : "s"} de{" "}
              <span className="font-medium text-foreground">
                {lines.length}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {lines.length}
              </span>{" "}
              producto{lines.length === 1 ? "" : "s"} en almacén
            </>
          )}
        </p>
        {lines.length > 0 && filteredTotal > 0 ? (
          <DataTablePaginationNav
            pageIndex={pagination.pageIndex}
            pageCount={pageCount}
            onPageIndexChange={(nextIndex) =>
              setPagination((p) => ({ ...p, pageIndex: nextIndex }))
            }
            navLabel="Paginación de inventario"
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-card-foreground">
            Valor total del inventario
          </span>
          <span className="text-xs text-muted-foreground">
            Al costo con el que entró la mercancía
          </span>
        </div>
        <span className="text-base font-bold tabular-nums text-card-foreground">
          {totalStockValue === null
            ? "—"
            : `$${formatClosingCurrency(totalStockValue)}`}
        </span>
      </div>
    </CardContent>
  )
}
