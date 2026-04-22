"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import { sileo } from "sileo";
import { LayoutGrid, Loader2 } from "lucide-react";
import type { GetAllProductsResponse, Product } from "@/lib/types/product";
import { Card, CardContent } from "@/components/ui/card";
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
import { useDeleteProductMutation } from "@/hooks/use-product";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import {
  createCatalogProductsColumns,
  type CatalogProductsColumnMeta,
} from "./catalog-products-table-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): CatalogProductsColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as CatalogProductsColumnMeta;
  }
  return {};
}

interface TableOfOtherProductsProps {
  products: Product[];
  meta: GetAllProductsResponse["meta"];
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function TableOfOtherProducts({
  products,
  meta,
  isFetching = false,
  onPageChange,
  onLimitChange,
}: TableOfOtherProductsProps) {
  const deleteProductMutation = useDeleteProductMutation();

  const handleDeleteProduct = React.useCallback(
    async (productId: string) => {
      try {
        const response = await deleteProductMutation.mutateAsync(productId);
        if (response) {
          sileo.success({
            title: "Producto eliminado correctamente",
            fill: "",
            styles: {
              title: "text-white! text-[16px]! font-bold!",
              description: "text-white/90! text-[15px]!",
            },
            description: "El producto se ha eliminado correctamente",
          });
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.message) {
          sileo.error({
            title: error.response?.data?.error,
            styles: { description: "text-[#dc2626]/90! text-[15px]!" },
            description: error.response?.data?.message,
          });
        } else {
          sileo.error({
            title: "Error al eliminar el producto",
            fill: "",
            styles: {
              title: "text-white! text-[16px]! font-bold!",
              description: "text-white/90! text-[15px]!",
            },
            description: "Error al eliminar el producto. Intenta de nuevo.",
          });
        }
      }
    },
    [deleteProductMutation],
  );

  const columns = React.useMemo(
    () => createCatalogProductsColumns(handleDeleteProduct),
    [handleDeleteProduct],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: products,
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
          {isEmpty ? (
            <div className="px-4 py-6">
              <Empty className="border-border border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LayoutGrid />
                  </EmptyMedia>
                  <EmptyTitle>Sin productos en el catálogo</EmptyTitle>
                  <EmptyDescription>
                    Todavía no hay productos registrados en el catálogo.
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
                <Table id="catalog-products-table" className="min-w-[700px]">
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
              <span className="font-medium text-foreground">{products.length}</span>{" "}
              producto{products.length === 1 ? "" : "s"} de{" "}
              <span className="font-medium text-foreground">{meta.total}</span>{" "}
              en el catálogo
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
                  navLabel="Paginación del catálogo"
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
