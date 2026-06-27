"use client";

import { useState } from "react";
import { useGetAllExpensesQuery } from "@/hooks/use-expenses";
import { useBusiness } from "@/context/business-context";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import TableOfExpenses from "@/components/expenses/table-of-expenses";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ProBadge } from "@/components/ui/pro-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const DEFAULT_LIMIT = 5;

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [showAllBusinesses, setShowAllBusinesses] = useState(false);

  const { activeBusinessId } = useBusiness();
  const { isProPlan } = useUserRoleAndPlan();

  // Solo los usuarios Pro pueden ver el reporte consolidado de todos los negocios.
  const consolidated = isProPlan && showAllBusinesses;
  const businessId = consolidated ? undefined : activeBusinessId ?? undefined;

  const { data, isLoading, isFetching, isError } = useGetAllExpensesQuery({
    page,
    limit,
    businessId,
    enabled: consolidated || !!activeBusinessId,
  });


  if (isError) return <div>Error al cargar los gastos</div>;

  const showInitialSkeleton = isLoading && !data;

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  function handleShowAllBusinessesChange(next: boolean) {
    setShowAllBusinesses(next);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gastos
          </h1>
          <p className="text-muted-foreground">
            Consulta y administra los gastos de tu negocio
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Switch
                  id="all-businesses"
                  checked={consolidated}
                  disabled={!isProPlan}
                  onCheckedChange={handleShowAllBusinessesChange}
                />
                <Label
                  htmlFor="all-businesses"
                  className={!isProPlan ? "cursor-not-allowed" : undefined}
                >
                  Todos los negocios
                  {!isProPlan && <ProBadge />}
                </Label>
              </div>
            </TooltipTrigger>
            {!isProPlan && (
              <TooltipContent>Disponible en plan Pro</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
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
