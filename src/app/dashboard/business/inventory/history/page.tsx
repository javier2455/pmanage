"use client";

import { useState } from "react";
import { useBusiness } from "@/context/business-context";
import { useInventoryHistoryByBusinessId } from "@/hooks/use-inventory";
import InventoryHistoryTimeline from "@/components/inventory/inventory-history-timeline";
import { TimelineSkeleton } from "@/components/inventory/timeline-skeleton";

const DEFAULT_LIMIT = 10;

export default function InventoryHistoryPage() {
  const { activeBusinessId } = useBusiness();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } =
    useInventoryHistoryByBusinessId(activeBusinessId ?? "", { page, limit });

  if (isError) return <div>Error al cargar el historial de inventario</div>;

  const showInitialSkeleton = isLoading && !data;

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Historial de inventario
        </h1>
        <p className="text-muted-foreground">
          Consulta las entradas de stock registradas para tu negocio.
        </p>
      </div>
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
        />
      )}
    </section>
  );
}
