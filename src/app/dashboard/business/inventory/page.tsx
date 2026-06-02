"use client";

import { useState } from "react";
import { useBusiness } from "@/context/business-context";
import { useCurrentInventoryByBusinessId } from "@/hooks/use-inventory";
import { useStockAlerts } from "@/hooks/use-stock-alerts";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import TableOfCurrentInventory from "@/components/inventory/table-of-current-inventory";
import { LowStockAlertBanner } from "@/components/inventory/low-stock-alert-banner";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";

const DEFAULT_LIMIT = 10;

export default function InventoryPage() {
  const { activeBusinessId } = useBusiness();
  const { isProPlan } = useUserRoleAndPlan();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } = useCurrentInventoryByBusinessId(
    activeBusinessId ?? "",
    { page, limit },
  );

  // Alertas de stock — feature Pro. El endpoint solo se consulta para usuarios Pro.
  const { data: stockAlertsData } = useStockAlerts(
    isProPlan ? (activeBusinessId ?? "") : "",
  );
  const alerts = stockAlertsData?.alerts ?? [];

  if (isError) return <div>Error al cargar el stock del negocio</div>;

  const showInitialSkeleton = isLoading && !data;

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Stock actual
        </h1>
        <p className="text-muted-foreground">
          Consulta el stock disponible por producto en tu negocio.
        </p>
      </div>
      {isProPlan && <LowStockAlertBanner alerts={alerts} />}
      {showInitialSkeleton ? (
        <SimpleTableSkeleton />
      ) : (
        <TableOfCurrentInventory
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
          alerts={alerts}
          canManageAlerts={isProPlan}
          businessId={activeBusinessId ?? ""}
        />
      )}
    </section>
  );
}
