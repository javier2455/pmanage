"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { SelectableBusinessProduct } from "@/lib/types/product-list";

const CHECKBOX_DARK = "dark:bg-card dark:border-white";
const UNCATEGORIZED = "Sin categoría";

interface ProductSelectorProps {
  products: SelectableBusinessProduct[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onlyInStock: boolean;
  onOnlyInStockChange: (value: boolean) => void;
  isLoading: boolean;
}

export function ProductSelector({
  products,
  selectedIds,
  onSelectionChange,
  search,
  onSearchChange,
  onlyInStock,
  onOnlyInStockChange,
  isLoading,
}: ProductSelectorProps) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  // El filtro de stock afecta a lo que se ve y a lo que "seleccionar todos"
  // marca: si no, el usuario acabaría publicando productos que no ve.
  const visible = useMemo(
    () => (onlyInStock ? products.filter((p) => Number(p.stock) > 0) : products),
    [products, onlyInStock],
  );

  const grouped = useMemo(() => {
    const groups = new Map<string, SelectableBusinessProduct[]>();
    for (const product of visible) {
      const key = product.category?.name?.trim() || UNCATEGORIZED;
      const bucket = groups.get(key);
      if (bucket) bucket.push(product);
      else groups.set(key, [product]);
    }
    return [...groups.entries()].sort(([a], [b]) => {
      if (a === UNCATEGORIZED) return 1;
      if (b === UNCATEGORIZED) return -1;
      return a.localeCompare(b, "es");
    });
  }, [visible]);

  const allVisibleSelected =
    visible.length > 0 && visible.every((p) => selected.has(p.id));

  function toggleProduct(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      const visibleIds = new Set(visible.map((p) => p.id));
      onSelectionChange(selectedIds.filter((id) => !visibleIds.has(id)));
      return;
    }
    onSelectionChange([...new Set([...selectedIds, ...visible.map((p) => p.id)])]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar producto..."
          className="pl-9"
          aria-label="Buscar producto"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="only-in-stock"
            className={CHECKBOX_DARK}
            checked={onlyInStock}
            onCheckedChange={(value) => onOnlyInStockChange(value === true)}
          />
          <Label htmlFor="only-in-stock" className="cursor-pointer font-normal">
            Solo disponibles (con stock)
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            className={CHECKBOX_DARK}
            checked={allVisibleSelected}
            disabled={visible.length === 0}
            onCheckedChange={toggleAllVisible}
          />
          <Label htmlFor="select-all" className="cursor-pointer font-normal">
            Seleccionar todos ({visible.length})
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {search
            ? "Ningún producto coincide con la búsqueda."
            : "Este negocio todavía no tiene productos disponibles."}
        </p>
      ) : (
        <ScrollArea className="h-[420px] pr-3">
          <div className="flex flex-col gap-4">
            {grouped.map(([categoryName, items]) => (
              <div key={categoryName} className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {categoryName}
                </p>
                {items.map((item) => {
                  const checkboxId = `product-${item.id}`;
                  const outOfStock = Number(item.stock) <= 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 hover:bg-muted/50"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Checkbox
                          id={checkboxId}
                          className={CHECKBOX_DARK}
                          checked={selected.has(item.id)}
                          onCheckedChange={() => toggleProduct(item.id)}
                        />
                        <Label
                          htmlFor={checkboxId}
                          className="cursor-pointer truncate font-normal"
                        >
                          {item.product?.name}
                          {outOfStock && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              agotado
                            </span>
                          )}
                        </Label>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {Number(item.effectivePrice ?? item.price).toLocaleString(
                          "es",
                          { maximumFractionDigits: 2 },
                        )}{" "}
                        CUP
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
