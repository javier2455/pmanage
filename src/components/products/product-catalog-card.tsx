"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/products/product-image";
import { BusinessProductActionsCell } from "@/components/products/business-products-table-columns";
import type { ProductToShowInTable } from "@/lib/types/product";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getStockAlertStatus,
  STOCK_ALERT_LABELS,
} from "@/lib/stock-alert";
import { formatStockWithUnit } from "@/lib/units";

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
  }).format(Number(value));
}

interface ProductCatalogCardProps {
  bp: ProductToShowInTable;
  onOpenDetails: (productId: string) => void;
  onDelete: (productId: string) => void | Promise<void>;
}

export function ProductCatalogCard({
  bp,
  onOpenDetails,
  onDelete,
}: ProductCatalogCardProps) {
  const unit = bp.product.unit;
  const status = getStockAlertStatus(
    bp.stock,
    null,
    DEFAULT_LOW_STOCK_THRESHOLD,
    unit,
  );
  const stockLabel = STOCK_ALERT_LABELS[status];
  const category =
    (bp.category ?? bp.product.category)?.name ?? "Sin categoría";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(bp.product.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails(bp.product.id);
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-all",
        "hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
      )}
    >
      {/* Imagen + estado de stock */}
      <div className="relative w-full overflow-hidden rounded-lg">
        <ProductImage
          src={bp.product.imageUrl}
          alt={bp.product.name}
          size="lg"
          className="aspect-square h-auto w-full rounded-lg"
        />
        <Badge
          variant="secondary"
          className={cn(
            "absolute right-1.5 top-1.5 border-transparent text-[10px] text-white shadow-sm",
            status === "out"
              ? "bg-destructive"
              : status === "low"
                ? "bg-amber-500"
                : "bg-emerald-500",
          )}
        >
          {status === "ok" ? formatStockWithUnit(bp.stock, unit) : stockLabel}
        </Badge>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 min-h-10 text-sm font-medium text-card-foreground">
          {bp.product.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {category}
        </span>
      </div>

      {/* Precio + acciones */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold tabular-nums text-primary">
          {formatCurrency(bp.price)}
        </span>
        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <BusinessProductActionsCell row={bp} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
