"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { CategoriesTable } from "@/components/categories/categories-table";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { useBusiness } from "@/context/business-context";
import { useGetAllExpenseCategoriesQuery } from "@/hooks/use-expense-categories";

const DEFAULT_LIMIT = 5;

type CategoryKind = "expenses";

const KIND_META: Record<
  CategoryKind,
  { title: string; description: string }
> = {
  expenses: {
    title: "Categorías de Gastos",
    description: "Administra las categorías que usarás para clasificar gastos.",
  },
};

function isValidKind(value: string | string[] | undefined): value is CategoryKind {
  return value === "expenses";
}

export default function CategoriesKindClient() {
  const params = useParams<{ kind: string | string[] }>();
  const kindParam = Array.isArray(params.kind) ? params.kind[0] : params.kind;

  const { activeBusinessId } = useBusiness();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } =
    useGetAllExpenseCategoriesQuery({
      page,
      limit,
      businessId: activeBusinessId ?? undefined,
      enabled: !!activeBusinessId && isValidKind(kindParam),
    });

  function handleLimitChange(nextLimit: number) {
    setLimit(nextLimit);
    setPage(1);
  }

  if (!isValidKind(kindParam)) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/business/categories"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
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

  const meta = KIND_META[kindParam];

  if (isError) return <div>Error al cargar las categorías</div>;

  const showInitialSkeleton = isLoading && !data;

  return (
    <section className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/categories"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {meta.title}
          </h1>
          <p className="text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {showInitialSkeleton ? (
        <SimpleTableSkeleton />
      ) : (
        <CategoriesTable
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
