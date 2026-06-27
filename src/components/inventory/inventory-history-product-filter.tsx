"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import type { BusinessWithProducts } from "@/lib/types/business";
import type { InventoryHistoryInclude } from "@/lib/types/inventory";

interface InventoryHistoryProductFilterProps {
  businessId: string;
  /** Producto del negocio seleccionado (`null` = ver todo el negocio). */
  selectedProduct: BusinessWithProducts | null;
  onProductChange: (product: BusinessWithProducts | null) => void;
  /** Tipo de movimientos a mostrar para el producto seleccionado. */
  include: InventoryHistoryInclude;
  onIncludeChange: (include: InventoryHistoryInclude) => void;
}

export default function InventoryHistoryProductFilter({
  businessId,
  selectedProduct,
  onProductChange,
  include,
  onIncludeChange,
}: InventoryHistoryProductFilterProps) {
  const { data, isLoading } = useAllProductOfMyBusinesses(businessId);
  const products: BusinessWithProducts[] = data?.data ?? [];

  const placeholder = isLoading
    ? "Cargando productos…"
    : products.length === 0
      ? "No hay productos en este negocio"
      : "Todos los productos";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="inventory-history-product" className="text-card-foreground">
          Filtrar por producto
        </Label>
        <Combobox<BusinessWithProducts | null>
          value={selectedProduct}
          onValueChange={(item) => onProductChange(item)}
          items={products}
          itemToStringLabel={(bp) => (bp ? bp.product.name : "")}
          isItemEqualToValue={(a, b) => a?.id === b?.id}
        >
          <ComboboxInput
            id="inventory-history-product"
            placeholder={placeholder}
            className="w-full"
            showClear={!!selectedProduct}
            disabled={isLoading || products.length === 0}
          />
          <ComboboxContent>
            <ComboboxList className="max-h-64">
              <ComboboxCollection>
                {(item: BusinessWithProducts) => (
                  <ComboboxItem value={item}>{item.product.name}</ComboboxItem>
                )}
              </ComboboxCollection>
              <ComboboxEmpty>No se encontró ningún producto.</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {selectedProduct ? (
        <div className="flex flex-col gap-2 sm:w-56">
          <Label
            htmlFor="inventory-history-include"
            className="text-card-foreground"
          >
            Movimientos
          </Label>
          <Select
            value={include}
            onValueChange={(value) =>
              onIncludeChange(value as InventoryHistoryInclude)
            }
          >
            <SelectTrigger id="inventory-history-include" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="increases">Solo entradas</SelectItem>
              <SelectItem value="all">Todos los movimientos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
