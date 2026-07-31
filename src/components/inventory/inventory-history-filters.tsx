"use client";

import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FileType2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProBadge } from "@/components/ui/pro-badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { fromLocalDateString, toLocalDateString } from "@/lib/date-range";
import type { BusinessWithProducts } from "@/lib/types/business";
import type { InventoryHistoryExportFormat } from "@/lib/inventory-history-export";
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
  onExport: (format: InventoryHistoryExportFormat) => void;
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
  const { hasFeature } = useUserRoleAndPlan();
  // Distinto de `canExport` (que indica si hay datos que exportar): esto es si
  // el PLAN concede Excel y PDF. El CSV está en todos los planes.
  const canUseRichExports = hasFeature("exports");
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
    <div className="flex flex-col gap-4" data-tour="inventory-history-filters">
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
                    <ComboboxItem key={item.id} value={item}>
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

        {/* CSV sigue abierto a todos los planes: era la exportación que ya
            existía y quitarla sería una regresión. Excel y PDF, que son los
            formatos nuevos, quedan reservados al plan Pro. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting || !canExport}
              className="w-fit"
              data-tour="inventory-history-export-btn"
            >
              <Download data-icon="inline-start" />
              {isExporting ? "Exportando…" : "Exportar"}
              <ChevronDown className="opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem onSelect={() => onExport("csv")}>
              <FileText />
              CSV (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canUseRichExports}
              onSelect={() => onExport("xlsx")}
            >
              <FileSpreadsheet className="text-emerald-600 dark:text-emerald-500" />
              Excel (.xlsx)
              {!canUseRichExports && <ProBadge />}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canUseRichExports}
              onSelect={() => onExport("pdf")}
            >
              <FileType2 className="text-red-600 dark:text-red-500" />
              PDF (.pdf)
              {!canUseRichExports && <ProBadge />}
            </DropdownMenuItem>
            {/* Un item deshabilitado no dispara hover, así que el motivo no
                cabe en un tooltip: va como nota al pie del menú. */}
            {!canUseRichExports && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Excel y PDF están disponibles en el plan Pro.
                </DropdownMenuLabel>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
