"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/products/product-image";
import { CatalogProductActionsCell } from "@/components/products/catalog-products-table-columns";
import type { Product } from "@/lib/types/product";

interface CatalogProductCardProps {
  product: Product;
  onOpenDetails: (productId: string) => void;
  onDelete: (productId: string) => void | Promise<void>;
}

export function CatalogProductCard({
  product,
  onOpenDetails,
  onDelete,
}: CatalogProductCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(product.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails(product.id);
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-all",
        "hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
      )}
    >
      {/* Imagen + unidad */}
      <div className="relative w-full overflow-hidden rounded-lg">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          size="lg"
          className="aspect-square h-auto w-full rounded-lg"
        />
        <Badge
          variant="secondary"
          className="absolute right-1.5 top-1.5 border-transparent bg-foreground text-[10px] text-background shadow-sm"
        >
          {product.unit}
        </Badge>
      </div>

      {/* Info + acciones */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 min-h-10 text-sm font-medium text-card-foreground">
            {product.name}
          </span>
        </div>
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <CatalogProductActionsCell row={product} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
