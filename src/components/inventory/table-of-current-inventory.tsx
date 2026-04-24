"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { History, Loader2, Package, Plus } from "lucide-react";
import type {
  CurrentInventoryEntry,
  InventoryMeta,
} from "@/lib/types/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import {
  currentInventoryColumns,
  type CurrentInventoryColumnMeta,
} from "./current-inventory-table-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): CurrentInventoryColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as CurrentInventoryColumnMeta;
  }
  return {};
}

interface TableOfCurrentInventoryProps {
  entries: CurrentInventoryEntry[];
  meta: InventoryMeta;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function TableOfCurrentInventory({
  entries,
  meta,
  isFetching = false,
  onPageChange,
  onLimitChange,
}: TableOfCurrentInventoryProps) {
  const table = useReactTable({
    data: entries,
    columns: currentInventoryColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
  });

  const isEmpty = meta.total === 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-end">
          <Button
            asChild
            variant="outline"
            className={cn(
              "w-full shrink-0 sm:w-auto",
              isFetching && "pointer-events-none opacity-50",
            )}
            aria-disabled={isFetching}
          >
            <Link
              href="/dashboard/business/inventory/history"
              tabIndex={isFetching ? -1 : undefined}
            >
              <History data-icon="inline-start" />
              Ver historial de inventario
            </Link>
          </Button>
          <Button
            asChild
            className={cn(
              "w-full shrink-0 sm:w-auto",
              isFetching && "pointer-events-none opacity-50",
            )}
            aria-disabled={isFetching}
          >
            <Link
              href="/dashboard/business/inventory/create"
              tabIndex={isFetching ? -1 : undefined}
            >
              <Plus data-icon="inline-start" />
              Agregar entrada
            </Link>
          </Button>
        </div>

        {isEmpty ? (
          <div className="px-4 pb-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>Sin stock registrado</EmptyTitle>
                <EmptyDescription>
                  Aún no hay productos con stock en este negocio. Registra una
                  entrada para verlos aquí.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="relative">
            {isFetching ? (
              <div
                className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cargando…</span>
                </div>
              </div>
            ) : null}
            <div
              className={cn(
                "transition-opacity",
                isFetching && "pointer-events-none opacity-60 select-none",
              )}
              aria-busy={isFetching}
            >
              <Table id="current-inventory-table" className="min-w-[560px]">
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
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">{entries.length}</span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{meta.total}</span>{" "}
            producto{meta.total === 1 ? "" : "s"}
            {meta.totalPages > 1 ? (
              <>
                {" "}— Página{" "}
                <span className="font-medium text-foreground">{meta.page}</span>{" "}
                de{" "}
                <span className="font-medium text-foreground">{meta.totalPages}</span>
              </>
            ) : null}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <PageSizeSelect
              value={meta.limit}
              onChange={onLimitChange}
              disabled={isFetching}
            />
            {meta.totalPages > 1 ? (
              <DataTablePaginationNav
                pageIndex={meta.page - 1}
                pageCount={meta.totalPages}
                onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                navLabel="Paginación de stock"
                disabled={isFetching}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
