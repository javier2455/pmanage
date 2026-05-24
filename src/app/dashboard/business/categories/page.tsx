"use client";

import * as React from "react";
import { HandCoins } from "lucide-react";
import { CategoryGroupCard } from "@/components/categories/category-group-card";
import { CategoryFormDialog } from "@/components/categories/category-form-dialog";
import { useBusiness } from "@/context/business-context";
import { useGetAllExpenseCategoriesQuery } from "@/hooks/use-expense-categories";

export default function CategoriesHubPage() {
  const { activeBusinessId } = useBusiness();
  const [createOpen, setCreateOpen] = React.useState(false);

  const { data, isLoading } = useGetAllExpenseCategoriesQuery({
    page: 1,
    limit: 5,
    businessId: activeBusinessId ?? undefined,
    enabled: !!activeBusinessId,
  });

  const previewItems = (data?.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
  const total = data?.meta.total ?? 0;

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
        <CategoryGroupCard
          title="Gastos"
          description="Categorías para clasificar tus gastos"
          icon={HandCoins}
          previewItems={previewItems}
          total={total}
          isLoading={isLoading}
          detailHref="/dashboard/business/categories/expenses"
          onCreateClick={() => setCreateOpen(true)}
        />
      </div>

      <CategoryFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </section>
  );
}
