"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiMessage, toastError, toastSuccess } from "@/lib/toast";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useGetPlanById, useUpdatePlanMutation } from "@/hooks/use-plans";
import { PlanForm } from "@/components/plans/plan-form";
import type { PlanFormData } from "@/lib/validations/plans";

export default function PlanEditClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("id") ?? "";

  const { data, isLoading, isError } = useGetPlanById(planId);
  const updatePlanMutation = useUpdatePlanMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const plan = data?.data;

  async function onSubmit(formData: PlanFormData) {
    setServerError(null);

    try {
      await updatePlanMutation.mutateAsync({
        planId,
        payload: {
          ...formData,
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description?.trim()
            ? formData.description.trim()
            : null,
        },
      });

      toastSuccess({
        title: "Plan actualizado",
        description: "Los cambios se aplicaron correctamente",
      });

      router.push("/dashboard/admin/plans");
    } catch (error) {
      const message =
        apiMessage(error) ?? "No se pudo actualizar el plan. Intenta de nuevo.";

      setServerError(message);
      toastError({ title: "Error al actualizar el plan", description: message });
    }
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/plans"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Editar plan</h1>
          <p className="text-muted-foreground">
            Los cambios afectan a los usuarios que ya tienen este plan
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando plan...
        </div>
      ) : isError || !plan ? (
        <p className="py-8 text-sm text-destructive">
          No se encontró el plan solicitado.
        </p>
      ) : (
        <PlanForm
          plan={plan}
          onSubmit={onSubmit}
          onCancel={() => router.push("/dashboard/admin/plans")}
          isSubmitting={updatePlanMutation.isPending}
          serverError={serverError}
          onInvalid={() =>
            toastError({
              title: "Revisa el formulario",
              description: "Completa todos los campos requeridos correctamente",
            })
          }
        />
      )}
    </section>
  );
}
