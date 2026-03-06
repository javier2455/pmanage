"use client";

import { useBusiness } from "@/context/business-context";
import { useAllInventoryByBusinessId } from "@/hooks/use-inventory";
import { Plus } from "lucide-react";
import Link from "next/link";
import TableOfInventory from "@/components/inventory/table-of-inventory";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";

export default function InventoryPage() {
  const { activeBusinessId } = useBusiness();
  const { data, isLoading, isFetching, isError } = useAllInventoryByBusinessId(activeBusinessId ?? "");

  if (isError) return <div>Error al cargar el inventario</div>;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Entradas de Productos
        </h1>
        <p className="text-muted-foreground">
          Consulta y actualiza los productos que entran a tu negocio y almacén.
        </p>
        <div className="flex justify-between items-center mb-4">
          <p className="text-muted-foreground">
            Total de entradas: <span className="font-bold text-foreground">{data?.length}</span>
          </p>
          <Link href="/dashboard/business/inventory/create" className="flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-all duration-300 bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Agregar entrada de producto
            <Plus className="size-4" />
          </Link>
        </div>
        {isLoading || isFetching ? (
          <SimpleTableSkeleton />
        ) : (
          <TableOfInventory entries={data ?? []} />
        )}
      </div>
    </section>
  )
}
