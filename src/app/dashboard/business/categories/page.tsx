"use client";

import * as React from "react";
import { CategoryGroupCard } from "@/components/categories/category-group-card";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import {
  CATEGORY_KINDS,
  type CategoryKind,
} from "@/components/categories/kind-config";
import { useBusiness } from "@/context/business-context";

const KIND_ORDER: CategoryKind[] = ["expenses", "products"];

function CategoryKindCard({ kind }: { kind: CategoryKind }) {
  const config = CATEGORY_KINDS[kind];
  const { activeBusinessId } = useBusiness();
  const [createOpen, setCreateOpen] = React.useState(false);

  // Gastos: filtradas por negocio activo. Productos: globales por usuario.
  const { data, isLoading } = config.useList(
    config.isBusinessScoped
      ? {
          page: 1,
          limit: 5,
          businessId: activeBusinessId ?? undefined,
          enabled: !!activeBusinessId,
        }
      : { page: 1, limit: 5 },
  );

  const previewItems = (data?.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const total = data?.meta.total ?? 0;

  return (
    <>
      <CategoryGroupCard
        title={config.cardTitle}
        description={config.cardDescription}
        icon={config.icon}
        previewItems={previewItems}
        total={total}
        isLoading={isLoading}
        detailHref={config.detailHref}
        onCreateClick={() => setCreateOpen(true)}
      />
      <CategoryFormDialog
        kind={kind}
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  );
}

export default function CategoriesHubPage() {
  return (
    <section className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Categorías
        </h1>
        <p className="text-muted-foreground">
          Crea y administra los nomencladores propios de tu negocio.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {KIND_ORDER.map((kind) => (
          <CategoryKindCard key={kind} kind={kind} />
        ))}
      </div>
    </section>
  );
}
