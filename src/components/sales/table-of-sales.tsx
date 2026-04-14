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
import Link from "next/link";
import axios from "axios";
import { sileo } from "sileo";
import { Plus, Receipt, Search } from "lucide-react";
import type { SaleWithProductAndBusiness } from "@/lib/types/sales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCancelSaleMutation } from "@/hooks/use-sales";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import {
  createSalesColumns,
  type SalesColumnMeta,
} from "./sales-table-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): SalesColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as SalesColumnMeta;
  }
  return {};
}

interface TableOfSalesProps {
  sales: SaleWithProductAndBusiness[];
}

export default function TableOfSales({ sales }: TableOfSalesProps) {
  const cancelSaleMutation = useCancelSaleMutation();

  const handleCancelSale = React.useCallback(
    async (saleId: string, cancellationReason: string) => {
      try {
        await cancelSaleMutation.mutateAsync({ saleId, cancellationReason });
        sileo.success({
          title: "Venta cancelada correctamente",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: "La venta se ha cancelado correctamente",
        });
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          sileo.error({
            title: error.response?.data?.error,
            styles: { description: "text-[#dc2626]/90! text-[15px]!" },
            description: error.response?.data?.message,
          });
        } else {
          sileo.error({
            title: "Error al cancelar la venta",
            fill: "",
            styles: {
              title: "text-white! text-[16px]! font-bold!",
              description: "text-white/90! text-[15px]!",
            },
            description: "Error al cancelar la venta. Intenta de nuevo.",
          });
        }
      }
    },
    [cancelSaleMutation],
  );

  const columns = React.useMemo(
    () => createSalesColumns(handleCancelSale),
    [handleCancelSale],
  );

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
  }, [sales]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters]);

  const table = useReactTable({
    data: sales,
    columns,
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

  const statusColumn = table.getColumn("status");
  const statusFilterRaw = statusColumn?.getFilterValue() as string | undefined;
  const statusSelectValue =
    statusFilterRaw && statusFilterRaw !== "all" ? statusFilterRaw : "all";

  const filteredTotal = table.getFilteredRowModel().rows.length;
  const hasActiveFilters = Boolean(
    statusFilterRaw && statusFilterRaw !== "all",
  );

  function clearAllFilters() {
    statusColumn?.setFilterValue(undefined);
  }

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/dashboard/business/sales/create">
                <Plus data-icon="inline-start" />
                Agregar venta
              </Link>
            </Button>
          </div>
          <Empty className="border-border border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Receipt />
              </EmptyMedia>
              <EmptyTitle>Sin ventas registradas</EmptyTitle>
              <EmptyDescription>
                Aún no hay ventas en este negocio. Registra una venta para verla
                aquí.
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
          <div className="flex flex-col gap-3 px-4 pt-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex w-full max-w-xs flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Estado
                  </span>
                  <Select
                    value={statusSelectValue}
                    onValueChange={(v) =>
                      statusColumn?.setFilterValue(v === "all" ? undefined : v)
                    }
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-full"
                      aria-label="Filtrar por estado"
                    >
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="active">Activas</SelectItem>
                        <SelectItem value="cancelled">Canceladas</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button asChild className="w-full shrink-0 lg:w-auto">
                <Link href="/dashboard/business/sales/create">
                  <Plus data-icon="inline-start" />
                  Agregar venta
                </Link>
              </Button>
            </div>
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
                    No hay ventas que coincidan con los filtros seleccionados.
                    Ajusta la búsqueda o el estado.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                  >
                    Limpiar filtros
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <Table id="sales-table" className="min-w-[700px]">
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
              {hasActiveFilters ? (
                <>
                  <span className="font-medium text-foreground">
                    {filteredTotal}
                  </span>{" "}
                  coincidencia{filteredTotal === 1 ? "" : "s"} de{" "}
                  <span className="font-medium text-foreground">
                    {sales.length}
                  </span>{" "}
                  ventas
                </>
              ) : (
                <>
                  Total:{" "}
                  <span className="font-medium text-foreground">
                    {sales.length}
                  </span>{" "}
                  venta{sales.length === 1 ? "" : "s"}
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
                navLabel="Paginación de ventas"
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
