"use client";

import * as React from "react";
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
} from "@tanstack/react-table";
import type { InventoryEntry } from "@/lib/types/inventory";
import Link from "next/link";
import { Package, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import {
  inventoryColumns,
  type InventoryColumnMeta,
} from "./inventory-table-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): InventoryColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as InventoryColumnMeta;
  }
  return {};
}

interface TableOfInventoryProps {
  entries: InventoryEntry[];
}

export default function TableOfInventory({ entries }: TableOfInventoryProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [entries]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters]);

  const table = useReactTable({
    data: entries,
    columns: inventoryColumns,
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
  });

  const pageCount = table.getPageCount();
  const maxPageIndex = Math.max(0, pageCount - 1);
  React.useEffect(() => {
    if (pagination.pageIndex > maxPageIndex) {
      setPagination((p) => ({ ...p, pageIndex: maxPageIndex }));
    }
  }, [maxPageIndex, pagination.pageIndex]);

  const productColumn = table.getColumn("product");
  const productFilterValue = String(productColumn?.getFilterValue() ?? "");
  const filteredTotal = table.getFilteredRowModel().rows.length;
  const hasActiveProductFilter = productFilterValue.trim().length > 0;

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/dashboard/business/inventory/create">
                <Plus data-icon="inline-start" />
                Agregar entrada
              </Link>
            </Button>
          </div>
          <Empty className="border-border border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>Sin entradas de inventario</EmptyTitle>
              <EmptyDescription>
                Aún no hay movimientos registrados. Agrega una entrada de
                producto para verla aquí.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-full max-w-md flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="inventory-product-filter">
                Buscar por producto
              </label>
              <Input
                id="inventory-product-filter"
                type="search"
                placeholder="Nombre del producto…"
                value={productFilterValue}
                onChange={(e) =>
                  productColumn?.setFilterValue(
                    e.target.value.length ? e.target.value : undefined,
                  )
                }
                aria-controls="inventory-table"
              />
            </div>
            <Button asChild className="w-full shrink-0 sm:w-auto">
              <Link href="/dashboard/business/inventory/create">
                <Plus data-icon="inline-start" />
                Agregar entrada
              </Link>
            </Button>
          </div>

          {filteredTotal === 0 ? (
            <div className="px-4 pb-6">
              <Empty className="border-border border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>Sin resultados</EmptyTitle>
                  <EmptyDescription>
                    No hay entradas que coincidan con «{productFilterValue.trim()}».
                    Prueba con otro término o limpia el filtro.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => productColumn?.setFilterValue(undefined)}
                  >
                    Limpiar filtro
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
          <Table id="inventory-table" className="min-w-[700px]">
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
          )}

          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {hasActiveProductFilter ? (
                <>
                  <span className="font-medium text-foreground">
                    {filteredTotal}
                  </span>{" "}
                  coincidencia{filteredTotal === 1 ? "" : "s"} de{" "}
                  <span className="font-medium text-foreground">
                    {entries.length}
                  </span>{" "}
                  entradas
                </>
              ) : (
                <>
                  Total:{" "}
                  <span className="font-medium text-foreground">
                    {entries.length}
                  </span>{" "}
                  entrada{entries.length === 1 ? "" : "s"}
                </>
              )}
            </p>
            {filteredTotal > 0 ? (
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
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
