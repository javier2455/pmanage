"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { ChevronDown, History, Package, Plus, TrendingUp } from "lucide-react";
import type {
  CurrentInventoryEntry,
  InventoryMeta,
  StockAlert,
} from "@/lib/types/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SetStockAlertDialog } from "./set-stock-alert-dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTablePaginationNav } from "@/components/data-table/data-table-pagination-nav";
import { PageSizeSelect } from "@/components/data-table/page-size-select";
import { columnMeta } from "@/components/data-table/column-meta";
import { TableLoadingOverlay } from "@/components/data-table/table-loading-overlay";
import { buildCurrentInventoryColumns } from "./current-inventory-table-columns";

interface TableOfCurrentInventoryProps {
  entries: CurrentInventoryEntry[];
  meta: InventoryMeta;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  /** Alertas configuradas del negocio (de `useStockAlerts`). */
  alerts?: StockAlert[];
  /** Solo los usuarios Pro pueden configurar alertas de stock. */
  canManageAlerts?: boolean;
  businessId: string;
}

export default function TableOfCurrentInventory({
  entries,
  meta,
  isFetching = false,
  onPageChange,
  onLimitChange,
  alerts = [],
  canManageAlerts = false,
  businessId,
}: TableOfCurrentInventoryProps) {
  // Mapa businessProductId → umbral, derivado de las alertas configuradas.
  const thresholdByBusinessProductId = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const alert of alerts) map.set(alert.businessProductId, alert.threshold);
    return map;
  }, [alerts]);

  // Resuelve el umbral de una fila: prioriza el campo embebido del backend y
  // cae a las alertas resueltas vía `GET /stock-alerts`.
  const getThreshold = React.useCallback(
    (entry: CurrentInventoryEntry): number | null =>
      entry.stockAlertThreshold ??
      thresholdByBusinessProductId.get(entry.id) ??
      null,
    [thresholdByBusinessProductId],
  );

  const [alertTarget, setAlertTarget] =
    React.useState<CurrentInventoryEntry | null>(null);

  const columns = React.useMemo(
    () =>
      buildCurrentInventoryColumns({
        getThreshold,
        onConfigureAlert: canManageAlerts ? setAlertTarget : undefined,
      }),
    [getThreshold, canManageAlerts],
  );

  const table = useReactTable({
    data: entries,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta.totalPages,
  });

  const isEmpty = meta.total === 0;

  return (
    <TooltipProvider>
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-end">
          {/* Las dos vistas de consulta van juntas en un menú para que
              "Agregar entrada" —la acción que se usa a diario— no compita con
              ellas. Cada opción lleva subtítulo: sin él, nadie abre por primera
              vez algo llamado "Rentabilidad del producto". */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full shrink-0 sm:w-auto"
                disabled={isFetching}
                data-tour="inventory-more-options-btn"
              >
                Más opciones
                <ChevronDown data-icon="inline-end" className="opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-1">
              <Link
                href="/dashboard/business/inventory/history"
                className="flex items-start gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <History className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block font-medium">
                    Ver historial de inventario
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Entradas, salidas y ajustes con fecha y responsable
                  </span>
                </span>
              </Link>
              <Link
                href="/dashboard/business/inventory/profitability"
                className="flex items-start gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <TrendingUp
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  <span className="block font-medium">
                    Rentabilidad del producto
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Cuánto has recuperado de lo que invertiste
                  </span>
                </span>
              </Link>
            </PopoverContent>
          </Popover>
          <Button
            asChild
            className={cn(
              "w-full shrink-0 sm:w-auto",
              isFetching && "pointer-events-none opacity-50",
            )}
            aria-disabled={isFetching}
            data-tour="inventory-add-entry-btn"
          >
            <Link
              href="/dashboard/business/inventory/create"
              tabIndex={isFetching ? -1 : undefined}
            >
              <Plus data-icon="inline-start" />
              Agregar entrada
            </Link>
          </Button>
        </div>

        {isEmpty ? (
          <div className="px-4 pb-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Package />
                </EmptyMedia>
                <EmptyTitle>Sin stock registrado</EmptyTitle>
                <EmptyDescription>
                  Aún no hay productos con stock en este negocio. Registra una
                  entrada para verlos aquí.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="relative">
            {isFetching ? <TableLoadingOverlay /> : null}
            <div
              className={cn(
                "transition-opacity",
                isFetching && "pointer-events-none opacity-60 select-none",
              )}
              aria-busy={isFetching}
            >
              <Table id="current-inventory-table" className="min-w-[560px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "px-4 py-3 text-foreground",
                            columnMeta(header.column).headerClassName,
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "px-4 py-3 text-foreground",
                            columnMeta(cell.column).cellClassName,
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">{entries.length}</span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{meta.total}</span>{" "}
            producto{meta.total === 1 ? "" : "s"}
            {meta.totalPages > 1 ? (
              <>
                {" "}— Página{" "}
                <span className="font-medium text-foreground">{meta.page}</span>{" "}
                de{" "}
                <span className="font-medium text-foreground">{meta.totalPages}</span>
              </>
            ) : null}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <PageSizeSelect
              value={meta.limit}
              onChange={onLimitChange}
              disabled={isFetching}
            />
            {meta.totalPages > 1 ? (
              <DataTablePaginationNav
                pageIndex={meta.page - 1}
                pageCount={meta.totalPages}
                onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
                navLabel="Paginación de stock"
                disabled={isFetching}
              />
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>

      {alertTarget && (
        <SetStockAlertDialog
          open={!!alertTarget}
          onOpenChange={(open) => {
            if (!open) setAlertTarget(null);
          }}
          businessId={businessId}
          businessProductId={alertTarget.id}
          productName={alertTarget.product?.name ?? "Producto"}
          currentStock={alertTarget.stock}
          currentThreshold={getThreshold(alertTarget)}
          unit={alertTarget.product?.unit}
        />
      )}
    </TooltipProvider>
  );
}
