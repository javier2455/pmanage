"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import { useGetAllProductsQuery } from "@/hooks/use-product";
import type { Product } from "@/lib/types/product";

interface PriceHistoryProductSelectorProps {
  value: string | null;
  onChange: (productId: string | null, product: Product | null) => void;
}

const DEFAULT_LIMIT = 5;

export default function PriceHistoryProductSelector({
  value,
  onChange,
}: PriceHistoryProductSelectorProps) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState<number>(DEFAULT_LIMIT);

  const { data, isLoading, isFetching } = useGetAllProductsQuery({
    page,
    limit,
  });

  const products = data?.data ?? [];
  const meta = data?.meta ?? {
    total: 0,
    page,
    limit,
    totalPages: 0,
  };

  function handleSelect(productId: string) {
    const product = products.find((p) => p.id === productId) ?? null;
    onChange(productId, product);
  }

  function handleLimitChange(next: number) {
    setLimit(next);
    setPage(1);
  }

  const placeholder = isLoading
    ? "Cargando productos…"
    : products.length === 0
      ? "No hay productos disponibles"
      : "Selecciona un producto…";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="price-history-product" className="text-card-foreground">
          Producto
        </Label>
        <Select
          value={value ?? undefined}
          onValueChange={handleSelect}
          disabled={isLoading || products.length === 0}
        >
          <SelectTrigger id="price-history-product" className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {meta.total > 0 ? (
            <>
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {products.length}
              </span>{" "}
              de{" "}
              <span className="font-medium text-foreground">{meta.total}</span>{" "}
              producto{meta.total === 1 ? "" : "s"}
              {meta.totalPages > 1 ? (
                <>
                  {" "}— Página{" "}
                  <span className="font-medium text-foreground">
                    {meta.page}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {meta.totalPages}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <>Sin productos por mostrar</>
          )}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <PageSizeSelect
            value={limit}
            onChange={handleLimitChange}
            disabled={isFetching}
          />
          {meta.totalPages > 1 ? (
            <DataTablePaginationNav
              pageIndex={meta.page - 1}
              pageCount={meta.totalPages}
              onPageIndexChange={(nextIndex) => setPage(nextIndex + 1)}
              navLabel="Paginación de productos"
              disabled={isFetching}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
