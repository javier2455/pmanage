"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { sileo } from "sileo";
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

      sileo.success({
        title: "Plan actualizado",
        description: "Los cambios se aplicaron correctamente",
        styles: {
          title: "text-foreground! text-[16px]! font-bold!",
          description: "text-muted-foreground! text-[15px]!",
        },
      });

      router.push("/dashboard/admin/plans");
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? normalizeApiMessage(error.response.data.message)
          : "No se pudo actualizar el plan. Intenta de nuevo.";

      setServerError(message);
      sileo.error({
        title: "Error al actualizar el plan",
        description: message,
        styles: {
          title: "text-foreground! text-[16px]! font-bold!",
          description: "text-destructive! text-[15px]!",
        },
      });
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
            sileo.error({
              title: "Revisa el formulario",
              description: "Completa todos los campos requeridos correctamente",
              styles: {
                title: "text-foreground! text-[16px]! font-bold!",
                description: "text-destructive! text-[15px]!",
              },
            })
          }
        />
      )}
    </section>
  );
}

/**
 * El ValidationPipe del backend responde con un array de mensajes cuando falla
 * más de una regla; mostrarlo tal cual dejaría un "[object Object]" en pantalla.
 */
function normalizeApiMessage(message: unknown): string {
  if (Array.isArray(message)) return message.join(". ");
  return String(message);
}
