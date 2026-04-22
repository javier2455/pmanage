"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import axios from "axios";
import { sileo } from "sileo";
import { Loader2, Plus, Receipt } from "lucide-react";
import type { SaleWithProductAndBusiness, SalesResponseInterface } from "@/lib/types/sales";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
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
import { PageSizeSelect } from "@/components/data-table/page-size-select";
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
  meta: SalesResponseInterface["meta"];
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function TableOfSales({
  sales,
  meta,
  isFetching = false,
  onPageChange,
  onLimitChange,
}: TableOfSalesProps) {
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

  const table = useReactTable({
    data: sales,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  const isEmpty = meta.total === 0;

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex justify-end px-4 pt-4">
            <Button
              asChild
              className={cn(
                "w-full shrink-0 lg:w-auto",
                isFetching && "pointer-events-none opacity-50",
              )}
              aria-disabled={isFetching}
            >
              <Link
                href="/dashboard/business/sales/create"
                tabIndex={isFetching ? -1 : undefined}
              >
                <Plus data-icon="inline-start" />
                Agregar venta
              </Link>
            </Button>
          </div>

          {isEmpty ? (
            <div className="px-4 pb-6">
              <Empty className="border-border border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Receipt />
                  </EmptyMedia>
                  <EmptyTitle>Sin ventas registradas</EmptyTitle>
                  <EmptyDescription>
                    Aún no hay ventas en este negocio. Registra una venta para
                    verla aquí.
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
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">{sales.length}</span>{" "}
              de{" "}
              <span className="font-medium text-foreground">{meta.total}</span>{" "}
              venta{meta.total === 1 ? "" : "s"}
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
                  navLabel="Paginación de ventas"
                  disabled={isFetching}
                />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
