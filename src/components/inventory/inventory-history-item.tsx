"use client";

import type { InventoryEntry } from "@/lib/types/inventory";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/use-in-view";
import { getInventoryActionTypeStyle } from "./inventory-action-type-style";

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

function formatCurrency(value: string | number) {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(num);
}

function productInitials(name: string | undefined) {
  if (!name) return "·";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export default function InventoryHistoryItem({
  entry,
}: {
  entry: InventoryEntry;
}) {
  const { ref, inView } = useInView<HTMLLIElement>();
  const hasStockChange =
    entry.previousStock !== undefined && entry.newStock !== undefined;
  const style = getInventoryActionTypeStyle(entry.actionType);

  return (
    <li
      ref={ref}
      data-visible={inView ? "true" : "false"}
      className={cn(
        "relative pl-10 pb-8",
        "opacity-0 translate-y-3 transition-all duration-500 ease-out",
        "data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0",
        "motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:opacity-100",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute -left-1.75 top-2 h-3.5 w-3.5 rounded-full ring-4",
          style.dotClassName,
        )}
      />
      <Card className="overflow-hidden border-border">
        <CardContent className="flex flex-col-reverse items-stretch gap-0 p-0 sm:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
            <header>
              <h3 className="truncate font-medium text-foreground">
                {entry.product?.name ?? "Producto"}
              </h3>
            </header>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {entry.quantity ? (
                <span>
                  Cantidad:{" "}
                  <span className="text-foreground tabular-nums">
                    {entry.quantity}
                  </span>
                </span>
              ) : null}
              {hasStockChange ? (
                <span>
                  Stock:{" "}
                  <span className="text-foreground tabular-nums">
                    {entry.previousStock} → {entry.newStock}
                  </span>
                </span>
              ) : null}
              {entry.entryPrice ? (
                <span>
                  Precio de adquisición:{" "}
                  <span className="text-foreground tabular-nums">
                    {formatCurrency(entry.entryPrice)}
                  </span>
                </span>
              ) : null}
              {entry.supplier ? (
                <span>
                  Proveedor:{" "}
                  <span className="text-foreground">{entry.supplier}</span>
                </span>
              ) : null}
              {style.label ? (
                <Badge className={style.badgeClassName}>{style.label}</Badge>
              ) : null}
            </div>

            {entry.description ? (
              <p className="text-sm text-foreground">{entry.description}</p>
            ) : null}
            <div className="flex items-start gap-x-2">
              <span className="text-xs text-muted-foreground">
                Horario de creación:
              </span>
              <time
                dateTime={entry.createdAt}
                className="text-xs text-foreground tabular-nums"
              >
                {formatTimeOnly(entry.createdAt)}
              </time>
            </div>
          </div>

          <div className="relative h-40 w-full shrink-0 bg-white sm:mx-4 sm:h-auto sm:w-36 sm:self-stretch md:w-40">
            {entry.product?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.product.imageUrl}
                alt={entry.product?.name ?? "Producto"}
                className="absolute inset-0 h-full w-full object-contain sm:object-cover"
                loading="lazy"
              />
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-muted-foreground"
              >
                {productInitials(entry.product?.name)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
