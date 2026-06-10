"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CategoriesTable } from "@/components/categories/categories-table";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import {
  CATEGORY_KINDS,
  isValidCategoryKind,
  type CategoryKind,
} from "@/components/categories/kind-config";
import { useBusiness } from "@/context/business-context";

const DEFAULT_LIMIT = 5;

function BackLink() {
  return (
    <Link
      href="/dashboard/business/categories"
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
    </Link>
  );
}

function CategoriesKindContent({ kind }: { kind: CategoryKind }) {
  const config = CATEGORY_KINDS[kind];
  const { activeBusinessId } = useBusiness();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } = config.useList({
    page,
    limit,
    businessId: activeBusinessId ?? undefined,
    enabled: !!activeBusinessId,
  });

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  if (isError) return <div>Error al cargar las categorías</div>;

  const showInitialSkeleton = isLoading && !data;

  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <BackLink />
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <config.icon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {config.detailTitle}
            </h1>
            <p className="text-muted-foreground">{config.detailDescription}</p>
          </div>
        </div>
      </div>

      {showInitialSkeleton ? (
        <SimpleTableSkeleton />
      ) : (
        <CategoriesTable
          kind={kind}
          categories={data?.data ?? []}
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

export default function CategoriesKindClient() {
  const params = useParams<{ kind: string | string[] }>();
  const kindParam = Array.isArray(params.kind) ? params.kind[0] : params.kind;

  if (!isValidCategoryKind(kindParam)) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <BackLink />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tipo de categoría no reconocido
            </h1>
            <p className="text-muted-foreground">
              La familia <code className="font-mono">{kindParam}</code> aún no
              está disponible.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Key forces remount when kind changes, keeping hook order stable per instance.
  return <CategoriesKindContent key={kindParam} kind={kindParam} />;
}
