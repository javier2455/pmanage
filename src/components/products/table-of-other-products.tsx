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
import axios from "axios";
import { sileo } from "sileo";
import { LayoutGrid, Search } from "lucide-react";
import type { Product } from "@/lib/types/product";
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
import { useDeleteProductMutation } from "@/hooks/use-product";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
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
}

export default function TableOfOtherProducts({
  products,
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [products]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [columnFilters]);

  const table = useReactTable({
    data: products,
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

  const nameColumn = table.getColumn("name");
  const nameFilterValue = String(nameColumn?.getFilterValue() ?? "");

  const filteredTotal = table.getFilteredRowModel().rows.length;
  const hasNameFilter = nameFilterValue.trim().length > 0;

  function clearNameFilter() {
    nameColumn?.setFilterValue(undefined);
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <Empty className="border-border border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutGrid />
              </EmptyMedia>
              <EmptyTitle>Sin otros productos</EmptyTitle>
              <EmptyDescription>
                Todos los productos del catálogo ya están asignados a este
                negocio o el catálogo está vacío.
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
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="catalog-products-name-filter"
              >
                Buscar por nombre
              </label>
              <Input
                id="catalog-products-name-filter"
                type="search"
                placeholder="Nombre del producto…"
                value={nameFilterValue}
                onChange={(e) =>
                  nameColumn?.setFilterValue(
                    e.target.value.length ? e.target.value : undefined,
                  )
                }
                aria-controls="catalog-products-table"
              />
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
                    No hay productos que coincidan con «{nameFilterValue.trim()}».
                    Prueba con otro término o limpia la búsqueda.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearNameFilter}
                  >
                    Limpiar búsqueda
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
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
          )}

          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {hasNameFilter ? (
                <>
                  <span className="font-medium text-foreground">
                    {filteredTotal}
                  </span>{" "}
                  coincidencia{filteredTotal === 1 ? "" : "s"} de{" "}
                  <span className="font-medium text-foreground">
                    {products.length}
                  </span>{" "}
                  en el catálogo
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {products.length}
                  </span>{" "}
                  producto{products.length === 1 ? "" : "s"} disponible
                  {products.length === 1 ? "" : "s"} para asignar
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
                navLabel="Paginación del catálogo"
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
