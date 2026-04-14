"use client";

import { useBusiness } from "@/context/business-context";
import { useAllSalesByBusinessId } from "@/hooks/use-sales";
import type { SaleWithProductAndBusiness } from "@/lib/types/sales";
import TableOfSales from "@/components/sales/table-of-sales";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";

export default function SalesPage() {
  const { activeBusinessId } = useBusiness();
  const { data, isLoading, isFetching, isError } = useAllSalesByBusinessId(
    activeBusinessId ?? "",
  );

  const sales: SaleWithProductAndBusiness[] = data ?? [];

  if (isError) return <div>Error al cargar las ventas</div>;

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
        {isLoading || isFetching ? (
          <SimpleTableSkeleton />
        ) : (
          <TableOfSales sales={sales} />
        )}
    </section>
  );
}
