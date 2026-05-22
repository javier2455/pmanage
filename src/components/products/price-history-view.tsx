"use client";

import * as React from "react";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import { Card, CardContent } from "@/components/ui/card";
import { ProductImage } from "@/components/products/product-image";
import {
  useProductPriceHistory,
  useProductPriceHistoryByRange,
} from "@/hooks/use-product-price-history";
import type {
  PriceHistoryMeta,
} from "@/lib/types/price-history";
import type { ProductToShowInTable } from "@/lib/types/product";
import PriceHistoryTimeline from "./price-history-timeline";

interface PriceHistoryViewProps {
  businessProduct: ProductToShowInTable;
}

const DEFAULT_LIMIT = 5;
const FALLBACK_META: PriceHistoryMeta = {
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  totalPages: 1,
};

function toIsoStart(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toIsoEnd(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export default function PriceHistoryView({
  businessProduct,
}: PriceHistoryViewProps) {
  const businessProductId = businessProduct.id;
  const product = businessProduct.product;

  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState<number>(DEFAULT_LIMIT);
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();

  const hasFullRange = !!startDate && !!endDate;
  const isPartialRange = (!!startDate || !!endDate) && !hasFullRange;

  const rangeParams = React.useMemo(() => {
    if (!hasFullRange) return null;
    return {
      startDate: toIsoStart(startDate!),
      endDate: toIsoEnd(endDate!),
      page,
      limit,
    };
  }, [hasFullRange, startDate, endDate, page, limit]);

  const fullQuery = useProductPriceHistory(
    businessProductId,
    { page, limit },
    !hasFullRange,
  );
  const rangeQuery = useProductPriceHistoryByRange(
    businessProductId,
    rangeParams,
    hasFullRange,
  );

  const activeQuery = hasFullRange ? rangeQuery : fullQuery;
  const entries = activeQuery.data?.data ?? [];
  const meta = activeQuery.data?.meta ?? FALLBACK_META;

  function handleLimitChange(next: number) {
    setLimit(next);
    setPage(1);
  }

  function handleStartChange(date: Date | undefined) {
    setStartDate(date);
    setPage(1);
  }

  function handleEndChange(date: Date | undefined) {
    setEndDate(date);
    setPage(1);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              size="md"
            />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {product.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {product.category}
                {product.unit ? ` · ${product.unit}` : null}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-1.5 sm:items-end">
            <span className="text-xs font-medium text-muted-foreground">
              Filtrar por rango
            </span>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={handleStartChange}
              onEndDateChange={handleEndChange}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          {isPartialRange ? (
            <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Selecciona una fecha de inicio y fin para filtrar el historial.
            </p>
          ) : (
            <PriceHistoryTimeline
              entries={entries}
              isLoading={activeQuery.isLoading}
              isFetching={activeQuery.isFetching && !activeQuery.isLoading}
            />
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {entries.length}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{meta.total}</span>{" "}
            cambio{meta.total === 1 ? "" : "s"}
            {meta.totalPages > 1 ? (
              <>
                {" "}— Página{" "}
                <span className="font-medium text-foreground">{meta.page}</span>{" "}
                de{" "}
                <span className="font-medium text-foreground">
                  {meta.totalPages}
                </span>
              </>
            ) : null}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <PageSizeSelect
              value={limit}
              onChange={handleLimitChange}
              disabled={activeQuery.isFetching}
            />
            {meta.totalPages > 1 ? (
              <DataTablePaginationNav
                pageIndex={meta.page - 1}
                pageCount={meta.totalPages}
                onPageIndexChange={(nextIndex) => setPage(nextIndex + 1)}
                navLabel="Paginación del historial"
                disabled={activeQuery.isFetching}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
