"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import type {
  InventoryEntry,
  InventoryMeta,
} from "@/lib/types/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import InventoryHistoryItem from "./inventory-history-item";

interface InventoryHistoryTimelineProps {
  entries: InventoryEntry[];
  meta: InventoryMeta;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

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

type DayGroup = { label: string; items: InventoryEntry[] };

function groupByDay(entries: InventoryEntry[]): DayGroup[] {
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

export default function InventoryHistoryTimeline({
  entries,
  meta,
  isFetching = false,
  onPageChange,
  onLimitChange,
}: InventoryHistoryTimelineProps) {
  const isEmpty = meta.total === 0;
  const groups = React.useMemo(() => groupByDay(entries), [entries]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <Link href="/dashboard/business/inventory">
              <ArrowLeft data-icon="inline-start" />
              Volver a stock actual
            </Link>
          </Button>
        </div>

        {isEmpty ? (
          <div className="px-4 pb-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>Sin movimientos registrados</EmptyTitle>
                <EmptyDescription>
                  Aún no hay entradas de inventario en este negocio.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="relative px-4 pb-2">
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
                        <InventoryHistoryItem key={entry.id} entry={entry} />
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {entries.length}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{meta.total}</span>{" "}
            movimiento{meta.total === 1 ? "" : "s"}
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
              value={meta.limit}
              onChange={onLimitChange}
              disabled={isFetching}
            />
            {meta.totalPages > 1 ? (
              <DataTablePaginationNav
                pageIndex={meta.page - 1}
                pageCount={meta.totalPages}
                onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                navLabel="Paginación del historial"
                disabled={isFetching}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
