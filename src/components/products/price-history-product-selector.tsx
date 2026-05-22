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
import { useBusiness } from "@/context/business-context";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import type { ProductToShowInTable } from "@/lib/types/product";

interface PriceHistoryProductSelectorProps {
  value: string | null;
  onChange: (
    businessProductId: string | null,
    businessProduct: ProductToShowInTable | null,
  ) => void;
}

const DEFAULT_LIMIT = 5;

export default function PriceHistoryProductSelector({
  value,
  onChange,
}: PriceHistoryProductSelectorProps) {
  const { activeBusinessId } = useBusiness();
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState<number>(DEFAULT_LIMIT);

  const { data, isLoading, isFetching } = useAllProductOfMyBusinesses(
    activeBusinessId ?? "",
  );

  const allItems: ProductToShowInTable[] = data?.data ?? [];
  const total = allItems.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const pageItems = allItems.slice(start, start + limit);

  function handleSelect(businessProductId: string) {
    const item = allItems.find((p) => p.id === businessProductId) ?? null;
    onChange(businessProductId, item);
  }

  function handleLimitChange(next: number) {
    setLimit(next);
    setPage(1);
  }

  if (!activeBusinessId) {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
        <p className="text-sm font-medium">Selecciona un negocio</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Debes tener un negocio activo para consultar el historial de precios.
        </p>
      </div>
    );
  }

  const placeholder = isLoading
    ? "Cargando productos…"
    : total === 0
      ? "No hay productos en este negocio"
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
          disabled={isLoading || total === 0}
        >
          <SelectTrigger id="price-history-product" className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {pageItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {total > 0 ? (
            <>
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {pageItems.length}
              </span>{" "}
              de{" "}
              <span className="font-medium text-foreground">{total}</span>{" "}
              producto{total === 1 ? "" : "s"}
              {totalPages > 1 ? (
                <>
                  {" "}— Página{" "}
                  <span className="font-medium text-foreground">
                    {safePage}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {totalPages}
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
          {totalPages > 1 ? (
            <DataTablePaginationNav
              pageIndex={safePage - 1}
              pageCount={totalPages}
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
