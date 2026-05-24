"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CategoryGroupCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  previewItems: { id: string; name: string }[];
  total: number;
  isLoading?: boolean;
  detailHref: string;
  onCreateClick: () => void;
}

const PREVIEW_LIMIT = 5;

export function CategoryGroupCard({
  title,
  description,
  icon: Icon,
  previewItems,
  total,
  isLoading = false,
  detailHref,
  onCreateClick,
}: CategoryGroupCardProps) {
  const router = useRouter();
  const hasMore = total > PREVIEW_LIMIT;
  const isEmpty = !isLoading && total === 0;

  function handleCardActivate() {
    if (isLoading) return;
    router.push(detailHref);
  }

  function stopPropagation(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={`Ver categorías de ${title}`}
      onClick={handleCardActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleCardActivate();
        }
      }}
      className={cn(
        "group flex h-full flex-col cursor-pointer transition-all duration-200 ease-out",
        "hover:scale-[1.02] hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/25",
        "focus-visible:scale-[1.02] focus-visible:border-emerald-500/40 focus-visible:shadow-lg focus-visible:shadow-emerald-500/25",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        isLoading && "pointer-events-none opacity-80",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-card-foreground">
                {title}
              </CardTitle>
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums leading-none",
                  total > 0
                    ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
                aria-label={`${total} ${total === 1 ? "categoría" : "categorías"}`}
              >
                {isLoading ? "…" : total}
              </span>
            </div>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <Separator />
        <div className="flex flex-1 flex-col gap-1.5">
          {isLoading ? (
            <div className="flex flex-col gap-2 py-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : isEmpty ? (
            <p className="py-2 text-sm text-muted-foreground">
              Aún no hay categorías. Crea la primera para comenzar.
            </p>
          ) : (
            <ul className="flex flex-col">
              {previewItems.slice(0, PREVIEW_LIMIT).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 border-b border-border/60 py-1.5 text-sm text-foreground last:border-b-0"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span className="truncate">{item.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2" onClick={stopPropagation}>
          {hasMore ? (
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={detailHref} onClick={stopPropagation}>
                Ver todas
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={(event) => {
              event.stopPropagation();
              onCreateClick();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Nueva categoría
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
