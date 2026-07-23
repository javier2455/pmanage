"use client";

import { useEffect, useMemo, useState } from "react";
import TableOfProducts from "@/components/products/table";
import TableOfOtherProducts from "@/components/products/table-of-other-products";
import { useBusiness } from "@/context/business-context";
import { useAllProductOfMyBusinesses } from "@/hooks/use-business";
import { useGetAllProductsQuery } from "@/hooks/use-product";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import PriceHistoryButton from "@/components/products/price-history-button";

const DEFAULT_CATALOG_LIMIT = 5;

export default function ProductsPage() {
  const { activeBusinessId } = useBusiness();

  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogLimit, setCatalogLimit] = useState(DEFAULT_CATALOG_LIMIT);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [debouncedCatalogSearch, setDebouncedCatalogSearch] = useState("");

  const [businessSearch, setBusinessSearch] = useState("");
  const [debouncedBusinessSearch, setDebouncedBusinessSearch] = useState("");

  // Debounce del término de búsqueda para no disparar una request por tecla.
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedCatalogSearch(catalogSearch.trim()),
      300,
    );
    return () => clearTimeout(timer);
  }, [catalogSearch]);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedBusinessSearch(businessSearch.trim()),
      300,
    );
    return () => clearTimeout(timer);
  }, [businessSearch]);

  // Al cambiar la búsqueda, volvemos a la primera página de resultados.
  // Se hace en el handler (no en un efecto) para evitar renders en cascada.
  function handleCatalogSearchChange(value: string) {
    setCatalogSearch(value);
    setCatalogPage(1);
  }

  const { data, isLoading, isFetching, isError } = useAllProductOfMyBusinesses(
    activeBusinessId ?? "",
    debouncedBusinessSearch,
  );
  const {
    data: allProductsData,
    isLoading: allProductsLoading,
    isFetching: allProductsFetching,
    isError: allProductsError,
  } = useGetAllProductsQuery({
    page: catalogPage,
    limit: catalogLimit,
    search: debouncedCatalogSearch,
  });

  const businessProducts = data?.data;
  const catalogProducts = allProductsData?.data ?? [];

  // La categoría y la última actualización viven en el `BusinessProduct` (por
  // negocio), no en el catálogo (`Product`). Mapeamos productId -> datos del
  // negocio activo para mostrarlos en los detalles del catálogo. Ver
  // docs/category.md.
  const catalogBusinessInfoByProductId = useMemo(() => {
    const map: Record<
      string,
      { categoryName: string | null; updatedAt: string | Date | null }
    > = {};
    for (const bp of businessProducts ?? []) {
      map[bp.product.id] = {
        categoryName: bp.category?.name ?? bp.product.category?.name ?? null,
        updatedAt: bp.updatedAt ?? null,
      };
    }
    return map;
  }, [businessProducts]);

  const showBusinessInitialSkeleton = isLoading && !data;
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
                businessInfoByProductId={catalogBusinessInfoByProductId}
                meta={
                  allProductsData?.meta ?? {
                    total: 0,
                    page: catalogPage,
                    limit: catalogLimit,
                    totalPages: 0,
                  }
                }
                isFetching={allProductsFetching}
                searchValue={catalogSearch}
                onSearchChange={handleCatalogSearchChange}
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
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
              <PriceHistoryButton />
              <Button asChild>
                <Link href="/dashboard/business/products/asign-to-business">
                  <Plus data-icon="inline-start" />
                  Asignar producto
                </Link>
              </Button>
            </div>
            {showBusinessInitialSkeleton ? (
              <SimpleTableSkeleton />
            ) : (
              <TableOfProducts
                products={businessProducts ?? []}
                isFetching={isFetching}
                searchValue={businessSearch}
                onSearchChange={setBusinessSearch}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
