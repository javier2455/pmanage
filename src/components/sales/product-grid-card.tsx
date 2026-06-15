"use client";

import { useState } from "react";
import { BusinessWithProducts } from "@/lib/types/business";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProductImage } from "@/components/products/product-image";
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  getStockAlertStatus,
  STOCK_ALERT_LABELS,
} from "@/lib/stock-alert";
import {
  formatStockWithUnit,
  isIntegerUnit,
  parseDecimalInput,
} from "@/lib/units";

function formatMoney(value: number | string) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ProductGridCardProps {
  bp: BusinessWithProducts;
  /** Cantidad de este producto que ya está en el carrito. */
  quantityInCart: number;
  /** Suma +1 (unidades enteras). */
  onAdd: (bp: BusinessWithProducts) => void;
  /** Fija una cantidad absoluta (unidades de peso/volumen). */
  onSetQuantity: (bp: BusinessWithProducts, quantity: number) => void;
}

export function ProductGridCard({
  bp,
  quantityInCart,
  onAdd,
  onSetQuantity,
}: ProductGridCardProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [draftQty, setDraftQty] = useState("");

  const unit = bp.product.unit;
  const integerUnit = isIntegerUnit(unit);
  const available = bp.stock - quantityInCart;
  const outOfStock = available <= 0;

  const status = getStockAlertStatus(
    available,
    bp.stockAlertThreshold,
    DEFAULT_LOW_STOCK_THRESHOLD,
    unit,
  );
  const stockLabel = STOCK_ALERT_LABELS[status];

  const category =
    bp.category?.name ?? bp.product.category?.name ?? "Sin categoría";

  function handleClick() {
    if (outOfStock) return;
    if (integerUnit) {
      onAdd(bp);
    } else {
      setDraftQty(quantityInCart > 0 ? String(quantityInCart) : "");
      setPopoverOpen(true);
    }
  }

  function confirmDecimal() {
    const parsed = parseDecimalInput(draftQty);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    onSetQuantity(bp, Math.min(parsed, bp.stock));
    setPopoverOpen(false);
  }

  const card = (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      aria-label={`Agregar ${bp.product.name}`}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-all cursor-pointer",
        "hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        quantityInCart > 0 && "border-primary ring-1 ring-primary",
        outOfStock &&
          "cursor-not-allowed opacity-50 hover:border-border hover:shadow-none",
      )}
    >
      {/* Imagen */}
      <div className="relative w-full overflow-hidden rounded-lg">
        <ProductImage
          src={bp.product.imageUrl}
          alt={bp.product.name}
          size="lg"
          className="aspect-square h-auto w-full rounded-lg"
        />
        {quantityInCart > 0 && (
          <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums">
            ×
            {integerUnit
              ? quantityInCart
              : formatStockWithUnit(quantityInCart, unit).replace(
                  ` ${unit}`,
                  "",
                )}
          </span>
        )}
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
          {status === "ok" ? formatStockWithUnit(available, unit) : stockLabel}
        </Badge>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 text-sm font-medium text-card-foreground min-h-12.5">
          {bp.product.name}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {category}
        </span>
        <span className="mt-1 text-base font-bold tabular-nums text-primary">
          ${formatMoney(bp.price)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            MN
          </span>
        </span>
      </div>
    </button>
  );

  if (integerUnit) {
    return card;
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{card}</PopoverTrigger>
      <PopoverContent className="w-56" align="center">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {bp.product.name}
            </span>
            <span className="text-xs text-muted-foreground">
              Disponible: {formatStockWithUnit(bp.stock, unit)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              inputMode="decimal"
              autoFocus
              value={draftQty}
              onChange={(e) => setDraftQty(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmDecimal();
                }
              }}
              placeholder={`Cantidad en ${unit}`}
              className="h-9"
            />
          </div>
          <Button type="button" size="sm" onClick={confirmDecimal}>
            Agregar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
