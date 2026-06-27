"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useBusiness } from "@/context/business-context";
import {
  useInventoryHistoryByBusinessId,
  useProductInventoryHistory,
} from "@/hooks/use-inventory";
import InventoryHistoryTimeline from "@/components/inventory/inventory-history-timeline";
import InventoryHistoryProductFilter from "@/components/inventory/inventory-history-product-filter";
import { TimelineSkeleton } from "@/components/inventory/timeline-skeleton";
import type { BusinessWithProducts } from "@/lib/types/business";
import type { InventoryHistoryInclude } from "@/lib/types/inventory";

const DEFAULT_LIMIT = 10;

export default function InventoryHistoryPage() {
  const { activeBusinessId } = useBusiness();
  const businessId = activeBusinessId ?? "";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [selectedProduct, setSelectedProduct] =
    useState<BusinessWithProducts | null>(null);
  const [include, setInclude] = useState<InventoryHistoryInclude>("increases");

  const productId = selectedProduct?.product.id ?? "";
  const isProductView = !!selectedProduct;

  const businessQuery = useInventoryHistoryByBusinessId(businessId, {
    page,
    limit,
  });
  const productQuery = useProductInventoryHistory(
    businessId,
    productId,
    { page, limit, include },
  );

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
    setInclude("increases");
    resetToFirstPage();
  }

  function handleIncludeChange(nextInclude: InventoryHistoryInclude) {
    setInclude(nextInclude);
    resetToFirstPage();
  }

  if (isError) return <div>Error al cargar el historial de inventario</div>;

  const showInitialSkeleton = isLoading && !data;

  const productName = selectedProduct?.product.name ?? "";
  const emptyTitle = isProductView
    ? "Sin movimientos para este producto"
    : "Sin movimientos registrados";
  const emptyDescription = isProductView
    ? include === "all"
      ? `Aún no hay movimientos de inventario para ${productName}.`
      : `Aún no hay entradas de stock para ${productName}.`
    : "Aún no hay entradas de inventario en este negocio.";

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
              : "Consulta las entradas de stock registradas para tu negocio."}
          </p>
        </div>
      </div>

      <InventoryHistoryProductFilter
        businessId={businessId}
        selectedProduct={selectedProduct}
        onProductChange={handleProductChange}
        include={include}
        onIncludeChange={handleIncludeChange}
      />

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
