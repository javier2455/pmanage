"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2, Monitor, Search, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DesktopInstallation } from "@/lib/types/desktop-licenses";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import { columnMeta } from "@/components/data-table/column-meta";
import { TableLoadingOverlay } from "@/components/data-table/table-loading-overlay";
import { createInstallationsColumns } from "./installations-table-columns";

interface InstallationsTableProps {
  installations: DesktopInstallation[];
  isLoading: boolean;
  isFetching: boolean;
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function InstallationsTable({
  installations,
  isLoading,
  isFetching,
  total,
  totalPages,
  page,
  limit,
  onPageChange,
  onLimitChange,
  searchValue,
  onSearchChange,
}: InstallationsTableProps) {
  const columns = React.useMemo(() => createInstallationsColumns(), []);

  const table = useReactTable({
    data: installations,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
  });

  const hasSearch = searchValue.trim().length > 0;
  const pageCount = Math.max(1, totalPages);
  const isEmpty = !isLoading && installations.length === 0;

  const cardHeader = (
    <CardHeader>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
            <Monitor className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">Instalaciones</CardTitle>
            <CardDescription>
              Busca por código, negocio, dueño o correo
            </CardDescription>
          </div>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="desktop-installations-search"
            type="search"
            placeholder="Buscar instalación…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 pl-9 pr-9"
            aria-controls="desktop-installations-table"
          />
          {hasSearch ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </CardHeader>
  );

  if (isLoading) {
    return (
      <Card className="w-full max-w-full overflow-x-hidden">
        {cardHeader}
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>Cargando instalaciones…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-full overflow-x-hidden">
      {cardHeader}
      <CardContent className="w-full max-w-full p-0">
        {isEmpty ? (
          <div className="px-4 pb-6 pt-2">
            {hasSearch ? (
              <Empty className="border-border border bg-muted/30">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>Sin resultados</EmptyTitle>
                  <EmptyDescription>
                    No hay instalaciones que coincidan con «{searchValue.trim()}».
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onSearchChange("")}
                  >
                    Limpiar búsqueda
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <Empty className="border-border border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Monitor />
                  </EmptyMedia>
                  <EmptyTitle>Sin instalaciones</EmptyTitle>
                  <EmptyDescription>
                    Aparecen aquí cuando un PC con Negora se conecta por primera
                    vez o cuando das una de alta a mano.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        ) : (
          <div className="relative w-full max-w-full overflow-x-auto">
            {isFetching ? <TableLoadingOverlay /> : null}
            <div
              className={cn(
                "transition-opacity",
                isFetching && "pointer-events-none opacity-60 select-none",
              )}
              aria-busy={isFetching}
            >
              <Table id="desktop-installations-table" className="min-w-[900px]">
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
            Total:{" "}
            <span className="font-medium text-foreground">{total}</span>{" "}
            instalaci{total === 1 ? "ón" : "ones"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <PageSizeSelect
              value={limit}
              onChange={onLimitChange}
              disabled={isFetching}
            />
            {pageCount > 1 ? (
              <DataTablePaginationNav
                pageIndex={page - 1}
                pageCount={pageCount}
                onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                navLabel="Paginación de instalaciones"
                disabled={isFetching}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
