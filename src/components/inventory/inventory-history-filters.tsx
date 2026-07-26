"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import { fromLocalDateString, toLocalDateString } from "@/lib/date-range";
import type { BusinessWithProducts } from "@/lib/types/business";
import {
  INVENTORY_ACTION_TYPE_OPTIONS,
  inventoryActionTypeLabels,
  type InventoryActionType,
} from "@/lib/types/inventory";

/** Valor del selector cuando no se filtra por tipo. */
export const ALL_ACTION_TYPES = "all";

export type InventoryHistoryFilterState = {
  startDate?: string;
  endDate?: string;
  /** Un `InventoryActionType` o `ALL_ACTION_TYPES`. */
  actionType: string;
};

interface InventoryHistoryFiltersProps {
  businessId: string;
  /** Producto seleccionado (`null` = todo el negocio). */
  selectedProduct: BusinessWithProducts | null;
  onProductChange: (product: BusinessWithProducts | null) => void;
  filters: InventoryHistoryFilterState;
  onFiltersChange: (filters: InventoryHistoryFilterState) => void;
  onExport: () => void;
  isExporting: boolean;
  canExport: boolean;
}

export default function InventoryHistoryFilters({
  businessId,
  selectedProduct,
  onProductChange,
  filters,
  onFiltersChange,
  onExport,
  isExporting,
  canExport,
}: InventoryHistoryFiltersProps) {
  const { data, isLoading } = useAllProductOfMyBusinesses(businessId);
  const products: BusinessWithProducts[] = data?.data ?? [];

  const productPlaceholder = isLoading
    ? "Cargando productos…"
    : products.length === 0
      ? "No hay productos en este negocio"
      : "Todos los productos";

  function handleStartDateChange(date: Date | undefined) {
    const startDate = date ? toLocalDateString(date) : undefined;
    onFiltersChange({
      ...filters,
      startDate,
      // Un inicio posterior al fin dejaría el rango invertido y el backend lo
      // descartaría entero, mostrando algo que el usuario no pidió.
      endDate:
        startDate && filters.endDate && startDate > filters.endDate
          ? startDate
          : filters.endDate,
    });
  }

  function handleEndDateChange(date: Date | undefined) {
    const endDate = date ? toLocalDateString(date) : undefined;
    onFiltersChange({
      ...filters,
      endDate,
      startDate:
        endDate && filters.startDate && endDate < filters.startDate
          ? endDate
          : filters.startDate,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label
            htmlFor="inventory-history-product"
            className="text-card-foreground"
          >
            Producto
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
              placeholder={productPlaceholder}
              className="w-full"
              showClear={!!selectedProduct}
              disabled={isLoading || products.length === 0}
            />
            <ComboboxContent>
              <ComboboxList className="max-h-64">
                <ComboboxCollection>
                  {(item: BusinessWithProducts) => (
                    <ComboboxItem value={item}>
                      {item.product.name}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                <ComboboxEmpty>No se encontró ningún producto.</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        {/* El filtro de tipo ya no depende de haber elegido un producto: sin él
            la vista de negocio solo podía enseñar entradas de stock. */}
        <div className="flex flex-col gap-2 lg:w-56">
          <Label
            htmlFor="inventory-history-action-type"
            className="text-card-foreground"
          >
            Movimiento
          </Label>
          <Select
            value={filters.actionType}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, actionType: value })
            }
          >
            <SelectTrigger id="inventory-history-action-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ACTION_TYPES}>
                Todos los movimientos
              </SelectItem>
              {INVENTORY_ACTION_TYPE_OPTIONS.map((actionType) => (
                <SelectItem key={actionType} value={actionType}>
                  {inventoryActionTypeLabels[actionType as InventoryActionType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Label className="text-card-foreground">Rango de fechas</Label>
          <DateRangePicker
            startDate={
              filters.startDate
                ? (fromLocalDateString(filters.startDate) ?? undefined)
                : undefined
            }
            endDate={
              filters.endDate
                ? (fromLocalDateString(filters.endDate) ?? undefined)
                : undefined
            }
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting || !canExport}
          className="w-fit"
        >
          <Download data-icon="inline-start" />
          {isExporting ? "Exportando…" : "Exportar CSV"}
        </Button>
      </div>
    </div>
  );
}
