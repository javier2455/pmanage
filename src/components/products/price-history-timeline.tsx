"use client";

import * as React from "react";
import { LineChart, Loader2 } from "lucide-react";
import type { PriceHistoryEntry } from "@/lib/types/price-history";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import PriceHistoryItem from "./price-history-item";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(dateStr: string, now: Date): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return "Hoy";
  if (isSameDay(date, yesterday)) return "Ayer";

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

type DayGroup = { label: string; items: PriceHistoryEntry[] };

function groupByDay(entries: PriceHistoryEntry[]): DayGroup[] {
  const now = new Date();
  const groups: DayGroup[] = [];
  for (const entry of entries) {
    const label = formatDayLabel(entry.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(entry);
    } else {
      groups.push({ label, items: [entry] });
    }
  }
  return groups;
}

interface PriceHistoryTimelineProps {
  entries: PriceHistoryEntry[];
  isLoading?: boolean;
  isFetching?: boolean;
}

function TimelineSkeleton() {
  return (
    <div className="relative ml-4 border-l border-border pt-2">
      <h2 className="pb-3 pl-10 text-[18px] font-semibold text-foreground">
        <Skeleton className="h-5 w-24" />
      </h2>
      <ol className="list-none">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="relative pl-10 pb-6">
            <span
              aria-hidden="true"
              className="absolute -left-1.75 top-2 h-3.5 w-3.5 rounded-full bg-muted ring-4 ring-muted/40"
            />
            <div className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-7 w-16" />
              </div>
              <Skeleton className="mt-3 h-3 w-48" />
              <div className="mt-3 flex gap-3">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function PriceHistoryTimeline({
  entries,
  isLoading = false,
  isFetching = false,
}: PriceHistoryTimelineProps) {
  const groups = React.useMemo(() => groupByDay(entries), [entries]);

  if (isLoading) return <TimelineSkeleton />;

  if (entries.length === 0) {
    return (
      <Empty className="border-border border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LineChart />
          </EmptyMedia>
          <EmptyTitle>Sin cambios de precio</EmptyTitle>
          <EmptyDescription>
            Aún no hay cambios de precio registrados para este producto en el
            rango seleccionado.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="relative">
      {isFetching ? (
        <div
          className="pointer-events-auto absolute inset-0 z-10 flex items-start justify-center bg-background/60 pt-8 backdrop-blur-[1px]"
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
        <div className="relative ml-4 border-l border-border pt-2">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="pb-3 pl-10 text-[18px] font-semibold text-foreground">
                {group.label}
              </h2>
              <ol className="list-none">
                {group.items.map((entry) => (
                  <PriceHistoryItem key={entry.id} entry={entry} />
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
