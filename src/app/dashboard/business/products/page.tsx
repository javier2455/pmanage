"use client";

import { useMemo } from "react";
import TableOfProducts from "@/components/products/table";
import TableOfOtherProducts from "@/components/products/table-of-other-products";
import { useBusiness } from "@/context/business-context";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import { useGetAllProductsQuery } from "@/hooks/use-product";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { ProductToShowInTable } from "@/lib/types/product";

export default function ProductsPage() {
  const { activeBusinessId } = useBusiness();
  const businessId = activeBusinessId ?? "";

  const { data, isLoading, isFetching, isError } = useAllProductOfMyBusinesses(activeBusinessId ?? "");
  const { data: allProductsData, isLoading: allProductsLoading, isFetching: allProductsFetching, isError: allProductsError } = useGetAllProductsQuery();

  const businessProducts = data?.data;
  const allProducts = allProductsData?.data;

  /* useMemo - evita recalcular en cada render. */
  const productIdsInBusiness = useMemo(
    () => new Set((businessProducts ?? []).map((bp: ProductToShowInTable) => bp.product.id)),
    [businessProducts]
  );
  const otherProducts = useMemo(
    () => (allProducts ?? []).filter((p) => !productIdsInBusiness.has(p.id)),
    [allProducts, productIdsInBusiness]
  );

  const businessTableLoading = isLoading || isFetching;
  const otherTableLoading = allProductsLoading || allProductsFetching;

  if (isError) return <div>Error al cargar los productos del negocio</div>;
  if (allProductsError) return <div>Error al cargar el catálogo de productos</div>;

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Productos
        </h1>
        <p className="text-muted-foreground">
          Consulta, actualiza, añade y elimina productos de tu negocio
        </p>
        <div className="mb-4 flex items-center justify-end">
          <Button asChild>
            <Link href="/dashboard/business/products/create">
              <Plus data-icon="inline-start" />
              Crear producto
            </Link>
          </Button>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Todos los productos
            </h2>
            {otherTableLoading ? (
              <SimpleTableSkeleton />
            ) : (
              <TableOfOtherProducts products={otherProducts} />
            )}
          </div>

          <div>
            <h1 className="text-lg font-semibold text-foreground mb-3">
              Productos del negocio activo
            </h1>
            <p className="text-muted-foreground">
              Consulta, actualiza, añade y elimina productos de tu negocio
            </p>
            <div className="mb-4 flex items-center justify-end">
          <Button asChild>
            <Link href="/dashboard/business/products/asign-to-business">
              <Plus data-icon="inline-start" />
              Asignar producto
            </Link>
          </Button>
        </div>
            {businessTableLoading ? (
              <SimpleTableSkeleton />
            ) : (
              <TableOfProducts products={businessProducts ?? []} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
