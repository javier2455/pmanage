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
import { BusinessProductCombobox } from "@/components/inventory/business-product-combobox";
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
import { DateRangePicker } from "@/components/generic/date-range-picker";
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
  const { hasFeature } = useUserRoleAndPlan();
  // Distinto de `canExport` (que indica si hay datos que exportar): esto es si
  // el PLAN concede Excel y PDF. El CSV está en todos los planes.
  const canUseRichExports = hasFeature("exports");

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
        <BusinessProductCombobox
          businessId={businessId}
          value={selectedProduct}
          onValueChange={onProductChange}
          id="inventory-history-product"
          label="Producto"
          placeholder="Todos los productos"
          className="flex flex-1 flex-col"
        />

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
