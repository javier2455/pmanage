"use client";

import * as React from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { PriceHistoryEntry } from "@/lib/types/price-history";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";

const DASH = "—";

function formatTimeOnly(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return DASH;
  }
}

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return DASH;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseNumber(v: string | null): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

type DeltaInfo = {
  direction: "up" | "down" | "flat";
  percent: number | null;
};

function computeDelta(
  price: number | null,
  previous: number | null,
): DeltaInfo {
  if (price === null || previous === null) {
    return { direction: "flat", percent: null };
  }
  const diff = price - previous;
  const percent = previous !== 0 ? (diff / previous) * 100 : null;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  return { direction, percent };
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

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground tabular-nums">
        {value}
      </span>
    </div>
  );
}

export default function PriceHistoryItem({
  entry,
}: {
  entry: PriceHistoryEntry;
}) {
  const { ref, inView } = useInView<HTMLLIElement>();
  const price = parseNumber(entry.price);
  const previousPrice = parseNumber(entry.previousPrice);
  const delta = computeDelta(price, previousPrice);
  const deltaStyle = DELTA_STYLES[delta.direction];
  const DeltaIcon = deltaStyle.icon;
  const isInitial = previousPrice === null;

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
                {isInitial ? "Precio inicial" : "Precio actualizado"}
              </span>
              <span className="text-xl font-semibold text-foreground tabular-nums">
                {price !== null ? formatCurrency(price) : DASH}
              </span>
            </div>
            {delta.percent !== null ? (
              <div
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium tabular-nums",
                  deltaStyle.textClassName,
                )}
              >
                <DeltaIcon className="size-4" aria-hidden="true" />
                <span>
                  {delta.percent > 0 ? "+" : ""}
                  {delta.percent.toFixed(1)}%
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col">
            <Row
              label="Precio anterior"
              value={
                previousPrice !== null ? formatCurrency(previousPrice) : DASH
              }
            />
            <Row
              label="Stock"
              value={entry.stock !== null ? entry.stock : DASH}
            />
            <Row label="Usuario" value={entry.username ?? DASH} />
            <Row
              label="Horario"
              value={
                <time dateTime={entry.createdAt}>
                  {formatTimeOnly(entry.createdAt)}
                </time>
              }
            />
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
