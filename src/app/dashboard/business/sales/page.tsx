"use client";

import { useState } from "react";
import { useBusiness } from "@/context/business-context";
import { useAllSalesByBusinessId } from "@/hooks/use-sales";
import TableOfSales from "@/components/sales/table-of-sales";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { PendingSalesNotice } from "@/components/offline/pending-sales-notice";

const DEFAULT_LIMIT = 5;

export default function SalesPage() {
  const { activeBusinessId } = useBusiness();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } = useAllSalesByBusinessId(
    activeBusinessId ?? "",
    { page, limit },
  );

  // El aviso de ventas encoladas acompaña también al error: sin conexión y sin
  // copia guardada, es lo único que le dice a la persona dónde está su venta.
  if (isError)
    return (
      <section className="flex flex-col gap-4">
        <PendingSalesNotice />
        <div>Error al cargar las ventas</div>
      </section>
    );

  const showInitialSkeleton = isLoading && !data;

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ventas
        </h1>
        <p className="text-muted-foreground">
          Consulta y actualiza las ventas de tu negocio
        </p>
      </div>
      <PendingSalesNotice />
      {showInitialSkeleton ? (
        <SimpleTableSkeleton />
      ) : (
        <TableOfSales
          sales={data?.data ?? []}
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
