"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import {
  useProductPriceHistory,
  useProductPriceHistoryByRange,
} from "@/hooks/use-product-price-history";
import type { PriceHistoryMeta } from "@/lib/types/price-history";
import PriceHistoryTimeline from "./price-history-timeline";

interface PriceHistoryDialogProps {
  productId: string;
  productName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export default function PriceHistoryDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: PriceHistoryDialogProps) {
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
    productId,
    { page, limit },
    open && !hasFullRange,
  );
  const rangeQuery = useProductPriceHistoryByRange(
    productId,
    rangeParams,
    open && hasFullRange,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-160 md:max-w-3xl lg:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-card-foreground">
            Historial de precios
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {productName
              ? `Cambios de precio para ${productName}`
              : "Cambios de precio del producto"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-end gap-1.5 px-6 pt-4 pb-2">
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

        <div className="max-h-[55vh] overflow-y-auto px-6 pb-4 pt-2">
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

        <div className="flex flex-col gap-3 border-t border-border px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
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
      </DialogContent>
    </Dialog>
  );
}
