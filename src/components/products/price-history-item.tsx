"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight, User2 } from "lucide-react";
import type { PriceHistoryEntry } from "@/lib/types/price-history";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

function formatTimeOnly(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number) {
  if (Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUserId(userId: string): string {
  const looksLikeUuid = /^[0-9a-f-]{20,}$/i.test(userId);
  return looksLikeUuid ? `Usuario ${userId.slice(0, 8)}` : userId;
}

type DeltaInfo = {
  direction: "up" | "down" | "flat";
  absolute: number;
  percent: number | null;
};

function computeDelta(price: number, previous: number | null): DeltaInfo {
  if (previous == null) {
    return { direction: "flat", absolute: 0, percent: null };
  }
  const absolute = price - previous;
  const percent = previous !== 0 ? (absolute / previous) * 100 : null;
  const direction = absolute > 0 ? "up" : absolute < 0 ? "down" : "flat";
  return { direction, absolute, percent };
}

const DELTA_STYLES = {
  up: {
    icon: ArrowUpRight,
    dotClassName: "bg-emerald-500 ring-emerald-500/25",
    textClassName: "text-emerald-600 dark:text-emerald-400",
  },
  down: {
    icon: ArrowDownRight,
    dotClassName: "bg-rose-500 ring-rose-500/25",
    textClassName: "text-rose-600 dark:text-rose-400",
  },
  flat: {
    icon: ArrowRight,
    dotClassName: "bg-muted-foreground ring-muted-foreground/20",
    textClassName: "text-muted-foreground",
  },
} as const;

export default function PriceHistoryItem({
  entry,
}: {
  entry: PriceHistoryEntry;
}) {
  const { ref, inView } = useInView<HTMLLIElement>();
  const priceDelta = computeDelta(entry.price, entry.previousPrice);
  const deltaStyle = DELTA_STYLES[priceDelta.direction];
  const DeltaIcon = deltaStyle.icon;
  const hasStockChange =
    entry.previousStock != null && entry.previousStock !== entry.stock;

  return (
    <li
      ref={ref}
      data-visible={inView ? "true" : "false"}
      className={cn(
        "relative pl-10 pb-6",
        "opacity-0 translate-y-3 transition-all duration-500 ease-out",
        "data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0",
        "motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute -left-1.75 top-2 h-3.5 w-3.5 rounded-full ring-4",
          deltaStyle.dotClassName,
        )}
      />
      <Card className="overflow-hidden border-border">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {entry.previousPrice == null
                  ? "Precio inicial"
                  : "Precio actualizado"}
              </span>
              <span className="text-xl font-semibold text-foreground tabular-nums">
                {formatCurrency(entry.price)}
              </span>
            </div>
            {priceDelta.percent !== null ? (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium tabular-nums",
                  deltaStyle.textClassName,
                )}
              >
                <DeltaIcon className="size-4" aria-hidden="true" />
                <span>
                  {priceDelta.percent > 0 ? "+" : ""}
                  {priceDelta.percent.toFixed(1)}%
                </span>
              </div>
            ) : null}
          </div>

          {entry.previousPrice != null ? (
            <p className="text-xs text-muted-foreground">
              Desde{" "}
              <span className="text-foreground tabular-nums">
                {formatCurrency(entry.previousPrice)}
              </span>
              {priceDelta.absolute !== 0 ? (
                <>
                  {" · "}
                  <span
                    className={cn("tabular-nums", deltaStyle.textClassName)}
                  >
                    {priceDelta.absolute > 0 ? "+" : ""}
                    {formatCurrency(priceDelta.absolute)}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}

          {hasStockChange ? (
            <p className="text-xs text-muted-foreground">
              Stock:{" "}
              <span className="text-foreground tabular-nums">
                {entry.previousStock} → {entry.stock}
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <time
              dateTime={entry.createdAt}
              className="text-foreground tabular-nums"
            >
              {formatTimeOnly(entry.createdAt)}
            </time>
            {entry.userId ? (
              <span className="inline-flex items-center gap-1">
                <User2 className="size-3.5" aria-hidden="true" />
                <span className="text-foreground">
                  {formatUserId(entry.userId)}
                </span>
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
