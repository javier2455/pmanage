"use client";

import { useState } from "react";
import { useBusiness } from "@/context/business-context";
import { useAllWorkersByBusinessId } from "@/hooks/use-workers";
import TableOfWorkers from "@/components/workers/table-of-workers";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";

const DEFAULT_LIMIT = 5;

export default function WorkersPage() {
  const { activeBusinessId } = useBusiness();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } = useAllWorkersByBusinessId(
    activeBusinessId ?? "",
    { page, limit },
  );

  if (isError) return <div>Error al cargar los trabajadores</div>;

  const showInitialSkeleton = isLoading && !data;

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Trabajadores
        </h1>
        <p className="text-muted-foreground">
          Administra los trabajadores de tu negocio y sus permisos
        </p>
      </div>
      {showInitialSkeleton ? (
        <SimpleTableSkeleton />
      ) : (
        <TableOfWorkers
          workers={data?.data ?? []}
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
