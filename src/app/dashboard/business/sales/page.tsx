"use client";

import { useBusiness } from "@/context/business-context";
import { useAllSalesByBusinessId } from "@/hooks/use-sales";
import { Plus } from "lucide-react";
import Link from "next/link";
import TableOfSales from "@/components/sales/table-of-sales";

export default function SalesPage() {
  const { activeBusinessId } = useBusiness();
  const { data, isLoading, isError } = useAllSalesByBusinessId(activeBusinessId ?? '')

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al cargar las ventas</div>;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ventas
        </h1>
        <p className="text-muted-foreground">
          Consulta y actualiza las ventas de tu negocio
        </p>
        <div className="flex justify-end items-center mb-4">
          <Link href="/dashboard/business/sales/create" className="flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-all duration-300 bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Agregar venta
            <Plus className="size-4" />
          </Link>
        </div>
        <TableOfSales
          sales={data ?? []}
          onDelete={(sale) => {
            // TODO: Implementar eliminación de venta
            console.log("Eliminar venta:", sale.id);
          }}
        />
      </div>
    </section>
  )
}
