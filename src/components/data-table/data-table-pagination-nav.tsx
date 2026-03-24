"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PageStripItem = number | "ellipsis";

/** 1-based page numbers and ellipsis markers for the pagination strip. */
export function getPaginationStripItems(
  pageIndex: number,
  pageCount: number,
): PageStripItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const current = pageIndex + 1;

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", pageCount];
  }

  if (current >= pageCount - 3) {
    return [
      1,
      "ellipsis",
      pageCount - 4,
      pageCount - 3,
      pageCount - 2,
      pageCount - 1,
      pageCount,
    ];
  }

  return [
    1,
    "ellipsis",
    current - 1,
    current,
    current + 1,
    "ellipsis",
    pageCount,
  ];
}

export function DataTablePaginationNav({
  pageIndex,
  pageCount,
  onPageIndexChange,
  navLabel = "Paginación de la tabla",
}: {
  pageIndex: number;
  pageCount: number;
  onPageIndexChange: (nextIndex: number) => void;
  /** `aria-label` for the `<nav>`. */
  navLabel?: string;
}) {
  const items = React.useMemo(
    () => getPaginationStripItems(pageIndex, pageCount),
    [pageIndex, pageCount],
  );

  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageCount > 0 && pageIndex < pageCount - 1;

  if (pageCount <= 1) return null;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1"
      aria-label={navLabel}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-0 px-2 sm:gap-1.5 sm:px-3"
        disabled={!canPreviousPage}
        aria-label="Página anterior"
        onClick={() => onPageIndexChange(Math.max(0, pageIndex - 1))}
      >
        <ChevronLeft data-icon="inline-start" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex min-w-9 items-center justify-center px-1 text-sm text-muted-foreground select-none"
            aria-hidden
          >
            …
          </span>
        ) : (
          <Button
            key={`page-${i}-${item}`}
            type="button"
            variant={pageIndex === item - 1 ? "outline" : "ghost"}
            size="sm"
            className={cn(
              "size-9 min-w-9 shrink-0 p-0 tabular-nums",
              pageIndex !== item - 1 && "text-muted-foreground",
            )}
            aria-label={`Ir a la página ${item}`}
            aria-current={pageIndex === item - 1 ? "page" : undefined}
            onClick={() => onPageIndexChange(item - 1)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-0 px-2 sm:gap-1.5 sm:px-3"
        disabled={!canNextPage}
        aria-label="Página siguiente"
        onClick={() =>
          onPageIndexChange(Math.min(pageCount - 1, pageIndex + 1))
        }
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight data-icon="inline-end" />
      </Button>
    </nav>
  );
}
