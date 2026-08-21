"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiMessage, toastError, toastSuccess } from "@/lib/toast";
import { ArrowLeft } from "lucide-react";

import { useCreatePlanMutation } from "@/hooks/use-plans";
import { PlanForm } from "@/components/plans/plan-form";
import type { PlanFormData } from "@/lib/validations/plans";

export default function CreatePlanPage() {
  const router = useRouter();
  const createPlanMutation = useCreatePlanMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(data: PlanFormData) {
    setServerError(null);

    try {
      await createPlanMutation.mutateAsync({
        ...data,
        name: data.name.trim(),
        code: data.code.trim(),
        description: data.description?.trim() ? data.description.trim() : null,
      });

      toastSuccess({
        title: "Plan creado correctamente",
        description: "El nuevo plan se ha registrado exitosamente",
      });

      router.push("/dashboard/admin/plans");
    } catch (error) {
      const message =
        apiMessage(error) ?? "No se pudo crear el plan. Intenta de nuevo.";

      setServerError(message);
      toastError({ title: "Error al crear plan", description: message });
    }
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/admin/plans"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Crear plan</h1>
          <p className="text-muted-foreground">
            Define un nuevo plan para asignarlo a los usuarios
          </p>
        </div>
      </div>

      <PlanForm
        onSubmit={onSubmit}
        onCancel={() => router.push("/dashboard/admin/plans")}
        isSubmitting={createPlanMutation.isPending}
        serverError={serverError}
        onInvalid={() =>
          toastError({
            title: "Revisa el formulario",
            description: "Completa todos los campos requeridos correctamente",
          })
        }
      />
    </section>
  );
}
