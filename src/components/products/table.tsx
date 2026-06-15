"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import { sileo } from "sileo";
import {
  ArrowDown,
  ArrowUp,
  LayoutGrid,
  List,
  Loader2,
  Package,
  Search,
} from "lucide-react";
import type { ProductToShowInTable } from "@/lib/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCatalogCard } from "@/components/products/product-catalog-card";
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
import { useBusiness } from "@/context/business-context";
import { useDeleteProductInBusinessMutation } from "@/hooks/use-product";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import ProductDetailsDialog from "@/components/products/details-dialog";
import {
  createBusinessProductsColumns,
  type BusinessProductsColumnMeta,
} from "./business-products-table-columns";

function columnMeta(column: {
  columnDef: { meta?: unknown };
}): BusinessProductsColumnMeta {
  const meta = column.columnDef.meta;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as BusinessProductsColumnMeta;
  }
  return {};
}

interface TableOfProductsProps {
  products: ProductToShowInTable[];
  isFetching?: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function TableOfProducts({
  products,
  isFetching = false,
  searchValue,
  onSearchChange,
}: TableOfProductsProps) {
  const { activeBusinessId } = useBusiness();
  const deleteProductInBusinessMutation = useDeleteProductInBusinessMutation();

  const handleDeleteProduct = React.useCallback(
    async (productId: string) => {
      try {
        const response = await deleteProductInBusinessMutation.mutateAsync({
          businessId: activeBusinessId ?? "",
          productId,
        });
        if (response.success) {
          sileo.success({
            title: "Producto eliminado del negocio correctamente",
            fill: "",
            styles: {
              title: "text-white! text-[16px]! font-bold!",
              description: "text-white/90! text-[15px]!",
            },
            description:
              "El producto se ha eliminado del negocio correctamente",
          });
        } else {
          sileo.error({
            title: "Error al eliminar el producto del negocio",
            styles: { description: "text-[#dc2626]/90! text-[15px]!" },
            description: response.message,
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
            title: "Error al eliminar el producto del negocio",
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
    [activeBusinessId, deleteProductInBusinessMutation],
  );

  const columns = React.useMemo(
    () => createBusinessProductsColumns(handleDeleteProduct),
    [handleDeleteProduct],
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Vista de la lista: tabla (densa, ordenable por columnas) o tarjetas
  // (catálogo visual). Se recuerda entre visitas vía localStorage.
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");
  React.useEffect(() => {
    const stored = window.localStorage.getItem("business-products-view");
    if (stored === "grid" || stored === "table") setViewMode(stored);
  }, []);
  React.useEffect(() => {
    window.localStorage.setItem("business-products-view", viewMode);
  }, [viewMode]);

  const currentSort = sorting[0];
  const sortField = currentSort?.id ?? "";
  const sortDesc = currentSort?.desc ?? false;

  const [detailsProductId, setDetailsProductId] = React.useState<string | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const handleRowClick = React.useCallback((productId: string) => {
    setDetailsProductId(productId);
    setDetailsOpen(true);
  }, []);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // Al cambiar el conjunto de productos (nueva búsqueda en servidor), volvemos
  // a la primera página para no quedar en una página que ya no existe.
  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [products]);

  const table = useReactTable({
    data: products,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
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

  const hasSearch = searchValue.trim().length > 0;
  const isEmpty = products.length === 0;

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="flex flex-col gap-4 p-0">
          <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex w-full max-w-md flex-col gap-1.5">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="business-products-name-filter"
              >
                Buscar por nombre
              </label>
              <Input
                id="business-products-name-filter"
                type="search"
                placeholder="Nombre del producto…"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-controls="business-products-table"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {/* Orden: en tabla se usa el encabezado; en tarjetas, este control. */}
              {viewMode === "grid" ? (
                <div className="flex items-center gap-1.5">
                  <Select
                    value={sortField || undefined}
                    onValueChange={(id) =>
                      setSorting([{ id, desc: sortDesc }])
                    }
                  >
                    <SelectTrigger size="sm" className="w-37.5">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nombre</SelectItem>
                      <SelectItem value="price">Precio</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="category">Categoría</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={!sortField}
                    onClick={() =>
                      setSorting([
                        { id: sortField || "name", desc: !sortDesc },
                      ])
                    }
                    aria-label={
                      sortDesc ? "Orden descendente" : "Orden ascendente"
                    }
                  >
                    {sortDesc ? (
                      <ArrowDown className="size-4" />
                    ) : (
                      <ArrowUp className="size-4" />
                    )}
                  </Button>
                </div>
              ) : null}

              <div className="inline-flex items-center rounded-md border border-border p-0.5">
                <Button
                  type="button"
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("table")}
                  aria-label="Vista de tabla"
                  aria-pressed={viewMode === "table"}
                >
                  <List className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("grid")}
                  aria-label="Vista de tarjetas"
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {isEmpty ? (
            <div className="px-4 pb-6">
              <Empty
                className={cn(
                  "border-border border",
                  hasSearch ? "bg-muted/30" : "bg-card",
                )}
              >
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    {hasSearch ? <Search /> : <Package />}
                  </EmptyMedia>
                  <EmptyTitle>
                    {hasSearch
                      ? "Sin resultados"
                      : "Sin productos en este negocio"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {hasSearch
                      ? `No hay productos que coincidan con «${searchValue.trim()}». Prueba con otro término o limpia la búsqueda.`
                      : "Aún no has añadido productos a este negocio. Crea o asigna un producto para verlo aquí."}
                  </EmptyDescription>
                </EmptyHeader>
                {hasSearch ? (
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
                ) : null}
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
                {viewMode === "table" ? (
                <Table id="business-products-table" className="min-w-175">
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
                      <TableRow
                        key={row.id}
                        onClick={() => handleRowClick(row.original.product.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/60"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            onClick={
                              cell.column.id === "actions"
                                ? (e) => e.stopPropagation()
                                : undefined
                            }
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
                ) : (
                  <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {table.getRowModel().rows.map((row) => (
                      <ProductCatalogCard
                        key={row.id}
                        bp={row.original}
                        onOpenDetails={handleRowClick}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {hasSearch ? (
                <>
                  <span className="font-medium text-foreground">
                    {products.length}
                  </span>{" "}
                  coincidencia{products.length === 1 ? "" : "s"} para «
                  {searchValue.trim()}»
                </>
              ) : (
                <>
                  Total:{" "}
                  <span className="font-medium text-foreground">
                    {products.length}
                  </span>{" "}
                  producto{products.length === 1 ? "" : "s"}
                </>
              )}
            </p>
            {!isEmpty && pageCount > 1 ? (
              <DataTablePaginationNav
                pageIndex={pagination.pageIndex}
                pageCount={pageCount}
                onPageIndexChange={(nextIndex) =>
                  setPagination((p) => ({ ...p, pageIndex: nextIndex }))
                }
                navLabel="Paginación de productos del negocio"
                disabled={isFetching}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
      {detailsProductId ? (
        <ProductDetailsDialog
          productId={detailsProductId}
          // La categoría vive en el BusinessProduct; la pasamos desde la fila para
          // mostrarla en los detalles (el catálogo ya no la trae). Ver docs/category.md.
          categoryName={
            (products.find((p) => p.product.id === detailsProductId)?.category ??
              products.find((p) => p.product.id === detailsProductId)?.product
                .category)?.name ?? null
          }
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      ) : null}
    </TooltipProvider>
  );
}
