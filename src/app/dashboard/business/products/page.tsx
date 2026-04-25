"use client";

import { useState } from "react";
import TableOfProducts from "@/components/products/table";
import TableOfOtherProducts from "@/components/products/table-of-other-products";
import { useBusiness } from "@/context/business-context";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import { useGetAllProductsQuery } from "@/hooks/use-product";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";

const DEFAULT_CATALOG_LIMIT = 5;

export default function ProductsPage() {
  const { activeBusinessId } = useBusiness();

  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogLimit, setCatalogLimit] = useState(DEFAULT_CATALOG_LIMIT);

  const { data, isLoading, isFetching, isError } = useAllProductOfMyBusinesses(
    activeBusinessId ?? "",
  );
  const {
    data: allProductsData,
    isLoading: allProductsLoading,
    isFetching: allProductsFetching,
    isError: allProductsError,
  } = useGetAllProductsQuery({ page: catalogPage, limit: catalogLimit });

  const businessProducts = data?.data;
  const catalogProducts = allProductsData?.data ?? [];

  const businessTableLoading = isLoading || isFetching;
  const showCatalogInitialSkeleton = allProductsLoading && !allProductsData;

  function handleCatalogLimitChange(nextLimit: number) {
    setCatalogLimit(nextLimit);
    setCatalogPage(1);
  }

  if (isError) return <div>Error al cargar los productos del negocio</div>;
  if (allProductsError)
    return <div>Error al cargar el catálogo de productos</div>;

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
              Catálogo del almacén
            </h2>
            {showCatalogInitialSkeleton ? (
              <SimpleTableSkeleton />
            ) : (
              <TableOfOtherProducts
                products={catalogProducts}
                meta={
                  allProductsData?.meta ?? {
                    total: 0,
                    page: catalogPage,
                    limit: catalogLimit,
                    totalPages: 0,
                  }
                }
                isFetching={allProductsFetching}
                onPageChange={setCatalogPage}
                onLimitChange={handleCatalogLimitChange}
              />
            )}
          </div>

          <div>
            <h1 className="text-lg font-semibold text-foreground mb-2">
              Productos a la venta
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
  );
}
