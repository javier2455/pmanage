"use client";

import { useState } from "react";
import { useGetAllExpensesQuery } from "@/hooks/use-expenses";
import TableOfExpenses from "@/components/expenses/table-of-expenses";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";

const DEFAULT_LIMIT = 5;

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } = useGetAllExpensesQuery({
    page,
    limit,
  });

  if (isError) return <div>Error al cargar los gastos</div>;

  const showInitialSkeleton = isLoading && !data;

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Gastos
        </h1>
        <p className="text-muted-foreground">
          Consulta y administra los gastos de tu negocio
        </p>
      </div>
      {showInitialSkeleton ? (
        <SimpleTableSkeleton />
      ) : (
        <TableOfExpenses
          expenses={data?.data ?? []}
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
