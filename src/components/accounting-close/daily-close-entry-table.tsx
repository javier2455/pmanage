"use client"

import * as React from "react"
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
import { Package, Search } from "lucide-react"
import type { InventoryEntry } from "@/lib/types/inventory"
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
  dailyCloseEntryColumns,
  type DailyCloseEntryColumnMeta,
} from "./daily-close-entry-columns"

function columnMeta(column: {
  columnDef: { meta?: unknown }
}): DailyCloseEntryColumnMeta {
  const meta = column.columnDef.meta
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as DailyCloseEntryColumnMeta
  }
  return {}
}

interface DailyCloseEntryTableProps {
  entries: InventoryEntry[]
  totalExpense: number
}

export function DailyCloseEntryTable({
  entries,
  totalExpense,
}: DailyCloseEntryTableProps) {
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
  }, [entries])

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [columnFilters])

  const table = useReactTable({
    data: entries,
    columns: dailyCloseEntryColumns,
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
            htmlFor="daily-close-entry-search"
          >
            Buscar producto
          </label>
          <Input
            id="daily-close-entry-search"
            type="search"
            placeholder="Nombre del producto…"
            value={productFilterValue}
            onChange={(e) =>
              productColumn?.setFilterValue(
                e.target.value.length ? e.target.value : undefined,
              )
            }
            aria-controls="daily-close-entry-table"
            disabled={entries.length === 0}
          />
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="px-4 pb-4 pt-4">
          <Empty className="flex-none border-border border bg-muted/30 py-8 md:p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>Sin ingresos este día</EmptyTitle>
              <EmptyDescription>
                No hay movimientos de inventario registrados para la fecha
                seleccionada.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      ) : filteredTotal === 0 ? (
        <div className="px-4 pb-4 pt-4">
          <Empty className="flex-none border-border border bg-muted/30 py-8 md:p-8">
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
            id="daily-close-entry-table"
            className="w-full min-w-0 table-fixed"
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
                {entries.length}
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">
                {entries.length}
              </span>{" "}
              ingreso{entries.length === 1 ? "" : "s"} en la tabla
            </>
          )}
        </p>
        {entries.length > 0 && filteredTotal > 0 ? (
          <DataTablePaginationNav
            pageIndex={pagination.pageIndex}
            pageCount={pageCount}
            onPageIndexChange={(nextIndex) =>
              setPagination((p) => ({ ...p, pageIndex: nextIndex }))
            }
            navLabel="Paginación de ingresos del día"
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-4">
        <span className="text-sm font-semibold text-card-foreground">
          Total gastos del día
        </span>
        <span className="text-base font-bold tabular-nums text-destructive">
          ${formatClosingCurrency(totalExpense)}
        </span>
      </div>
    </CardContent>
  )
}
