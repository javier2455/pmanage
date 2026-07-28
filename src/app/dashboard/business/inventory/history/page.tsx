"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBusiness } from "@/context/business-context";
import {
  exportInventoryHistoryToExcel,
  exportInventoryHistoryToPdf,
  getInventoryHistoryByBusinessId,
  getProductInventoryHistory,
} from "@/lib/api/inventory";
import {
  useInventoryHistoryByBusinessId,
  useProductInventoryHistory,
} from "@/hooks/use-inventory";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import InventoryHistoryTimeline from "@/components/inventory/inventory-history-timeline";
import InventoryHistoryFilters, {
  ALL_ACTION_TYPES,
  type InventoryHistoryFilterState,
} from "@/components/inventory/inventory-history-filters";
import { TimelineSkeleton } from "@/components/inventory/timeline-skeleton";
import { ProductCostLayers } from "@/components/inventory/product-cost-layers";
import { ProductLotProfitability } from "@/components/inventory/product-lot-profitability";
import {
  EXPORT_FILE_EXTENSION,
  EXPORT_ROW_LIMIT,
  downloadInventoryHistoryCsv,
  type InventoryHistoryExportFormat,
} from "@/lib/inventory-history-export";
import { downloadBlob } from "@/lib/download";
import { mapCurrencyErrorFromBlob } from "@/lib/currency-errors";
import { toastError, toastSuccess } from "@/lib/toast";
import type { BusinessWithProducts } from "@/lib/types/business";

const DEFAULT_LIMIT = 10;

export default function InventoryHistoryPage() {
  const { activeBusinessId } = useBusiness();
  const { isProPlan } = useUserRoleAndPlan();
  const businessId = activeBusinessId ?? "";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [selectedProduct, setSelectedProduct] =
    useState<BusinessWithProducts | null>(null);
  const [filters, setFilters] = useState<InventoryHistoryFilterState>({
    actionType: ALL_ACTION_TYPES,
  });
  const [isExporting, setIsExporting] = useState(false);

  const productId = selectedProduct?.product.id ?? "";
  const isProductView = !!selectedProduct;

  // `all` es la ausencia de filtro; el backend descarta lo que no reconoce, así
  // que mandarlo tal cual devolvería cero filas.
  const actionTypeParam =
    filters.actionType === ALL_ACTION_TYPES ? undefined : filters.actionType;

  const queryFilters = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    actionType: actionTypeParam,
  };

  const businessQuery = useInventoryHistoryByBusinessId(businessId, {
    page,
    limit,
    ...queryFilters,
  });
  const productQuery = useProductInventoryHistory(businessId, productId, {
    page,
    limit,
    // Con el filtro de tipo unificado, la vista por producto ya no necesita el
    // parámetro `include`: siempre pide todos los movimientos y es `actionType`
    // quien acota.
    include: "all",
    ...queryFilters,
  });

  const activeQuery = isProductView ? productQuery : businessQuery;
  const { data, isLoading, isFetching, isError } = activeQuery;

  function resetToFirstPage() {
    setPage(1);
  }

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    resetToFirstPage();
  }

  function handleProductChange(product: BusinessWithProducts | null) {
    setSelectedProduct(product);
    resetToFirstPage();
  }

  function handleFiltersChange(next: InventoryHistoryFilterState) {
    setFilters(next);
    resetToFirstPage();
  }

  /** Nombre de archivo, con el producto cuando la vista está acotada a uno. */
  function exportFilename(format: InventoryHistoryExportFormat) {
    const suffix = isProductView
      ? `-${selectedProduct.product.name.replace(/\s+/g, "-").toLowerCase()}`
      : "";
    return `historial-inventario${suffix}.${EXPORT_FILE_EXTENSION[format]}`;
  }

  /**
   * El CSV se arma en el navegador con los movimientos ya paginados: la vista
   * los reconsulta con un límite alto y `papaparse` hace el resto.
   */
  async function exportCsv() {
    const response = isProductView
      ? await getProductInventoryHistory({
          businessId,
          productId,
          page: 1,
          limit: EXPORT_ROW_LIMIT,
          include: "all",
          ...queryFilters,
        })
      : await getInventoryHistoryByBusinessId({
          businessId,
          page: 1,
          limit: EXPORT_ROW_LIMIT,
          ...queryFilters,
        });

    const entries = response.data ?? [];
    if (entries.length === 0) {
      toastError({
        title: "Nada que exportar",
        description: "Ningún movimiento coincide con los filtros aplicados.",
      });
      return;
    }

    downloadInventoryHistoryCsv(entries, exportFilename("csv"));

    // El export está acotado: decirlo explícitamente evita que un archivo
    // recortado se lea como el historial completo.
    const total = response.meta?.total ?? entries.length;
    toastSuccess({
      title: "Historial exportado",
      description:
        total > entries.length
          ? `Se exportaron los ${entries.length} movimientos más recientes de ${total}. Acota el rango de fechas para incluir el resto.`
          : `${entries.length} ${entries.length === 1 ? "movimiento exportado" : "movimientos exportados"}.`,
    });
  }

  /**
   * Excel y PDF los genera el backend, que aplica el branding de Negora y
   * comprueba el plan Pro en servidor. El archivo indica en su cabecera si
   * quedó recortado, así que aquí basta con descargarlo.
   */
  async function exportServerFile(format: "xlsx" | "pdf") {
    const params = {
      businessId,
      ...(isProductView ? { productId } : {}),
      ...queryFilters,
    };

    const blob =
      format === "pdf"
        ? await exportInventoryHistoryToPdf(params)
        : await exportInventoryHistoryToExcel(params);

    downloadBlob(blob, exportFilename(format));

    toastSuccess({
      title: "Historial exportado",
      description:
        format === "pdf"
          ? "El PDF se ha descargado."
          : "El archivo de Excel se ha descargado.",
    });
  }

  async function handleExport(format: InventoryHistoryExportFormat) {
    // El servidor es quien decide, pero comprobarlo aquí evita una petición
    // condenada al 403 y da un mensaje más claro que el del guard.
    if (format !== "csv" && !isProPlan) {
      toastError({
        title: "Disponible en plan Pro",
        description:
          "Mejora tu plan para exportar el historial a Excel o PDF. El CSV sigue disponible.",
      });
      return;
    }

    setIsExporting(true);
    try {
      if (format === "csv") {
        await exportCsv();
      } else {
        await exportServerFile(format);
      }
    } catch (error) {
      // Los exports viajan como Blob, así que un error JSON del backend (403 de
      // plan, 404 de producto) llega sin parsear y hay que abrirlo a mano.
      toastError({
        title: "No se pudo exportar",
        description: await mapCurrencyErrorFromBlob(
          error,
          "Vuelve a intentarlo en unos segundos.",
        ),
      });
    } finally {
      setIsExporting(false);
    }
  }

  if (isError) return <div>Error al cargar el historial de inventario</div>;

  const showInitialSkeleton = isLoading && !data;
  const hasRows = (data?.data?.length ?? 0) > 0;

  const productName = selectedProduct?.product.name ?? "";
  const hasActiveFilters =
    !!filters.startDate ||
    !!filters.endDate ||
    filters.actionType !== ALL_ACTION_TYPES;

  const emptyTitle = hasActiveFilters
    ? "Sin movimientos para estos filtros"
    : isProductView
      ? "Sin movimientos para este producto"
      : "Sin movimientos registrados";
  const emptyDescription = hasActiveFilters
    ? "Prueba a ampliar el rango de fechas o a cambiar el tipo de movimiento."
    : isProductView
      ? `Aún no hay movimientos de inventario para ${productName}.`
      : "Aún no hay movimientos de inventario en este negocio.";

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4 flex items-center gap-4">
        <Link
          href="/dashboard/business/inventory"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Historial de inventario
          </h1>
          <p className="text-muted-foreground">
            {isProductView
              ? `Movimientos de ${selectedProduct.product.name}.`
              : "Consulta los movimientos de inventario registrados para tu negocio."}
          </p>
        </div>
      </div>

      <InventoryHistoryFilters
        businessId={businessId}
        selectedProduct={selectedProduct}
        onProductChange={handleProductChange}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={hasRows}
      />

      {/* Los lotes vivos solo tienen sentido mirando un producto concreto: es
          donde se ve cuántas unidades quedan de cada compra y a qué costo. */}
      {isProductView && (
        <ProductCostLayers
          businessId={businessId}
          productId={productId}
          unit={selectedProduct.product.unit}
          className="my-4"
        />
      )}

      {/* Y qué dejó cada lote ya vendido: el reverso de la tarjeta anterior,
          que solo mira el stock vivo. */}
      {isProductView && (
        <ProductLotProfitability
          businessId={businessId}
          productId={productId}
          unit={selectedProduct.product.unit}
          className="my-4"
        />
      )}

      {showInitialSkeleton ? (
        <TimelineSkeleton />
      ) : (
        <InventoryHistoryTimeline
          entries={data?.data ?? []}
          meta={
            data?.meta ?? {
              total: 0,
              page,
              limit,
              totalPages: 0,
            }
          }
          isFetching={isFetching}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      )}
    </section>
  );
}
