"use client";

import TableOfProducts from "@/components/products/table";
import { useBusiness } from "@/context/business-context";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const { activeBusinessId } = useBusiness();
  const { data, isLoading, isFetching, isError } = useAllProductOfMyBusinesses(activeBusinessId ?? "");

  if (isError) return <div>Error al cargar los productos</div>;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Productos
        </h1>
        <p className="text-muted-foreground">
          Consulta, actualiza, añade y elimina productos de tu negocio
        </p>
        <div className="flex justify-end items-center mb-4">
          <Link href="/dashboard/business/products/create" className="flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-all duration-300 bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Agregar producto
            <Plus className="size-4" />
          </Link>
        </div>
        {isLoading || isFetching ? (
          <SimpleTableSkeleton />
        ) : (
          <TableOfProducts products={data?.data ?? []} />
        )}
      </div>
    </section>
  )
}
