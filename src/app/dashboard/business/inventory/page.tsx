"use client";

import { useBusiness } from "@/context/business-context";
import { useAllInventoryByBusinessId } from "@/hooks/use-inventory";
import TableOfInventory from "@/components/inventory/table-of-inventory";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";

export default function InventoryPage() {
  const { activeBusinessId } = useBusiness();
  const { data, isLoading, isFetching, isError } = useAllInventoryByBusinessId(activeBusinessId ?? "");
  const entries = Array.isArray(data?.data) ? data.data : [];

  if (isError) return <div>Error al cargar el inventario</div>;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Entradas de Productos
          </h1>
          <p className="text-muted-foreground">
            Consulta y actualiza los productos que entran a tu negocio y almacén.
          </p>
        </div>
        {isLoading || isFetching ? (
          <SimpleTableSkeleton />
        ) : (
          <TableOfInventory entries={entries} />
        )}
      </div>
    </section>
  )
}
