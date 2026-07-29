"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { sileo } from "sileo";

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

      sileo.success({
        title: "Plan creado correctamente",
        description: "El nuevo plan se ha registrado exitosamente",
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
          : "No se pudo crear el plan. Intenta de nuevo.";

      setServerError(message);
      sileo.error({
        title: axios.isAxiosError(error)
          ? (error.response?.data?.error ?? "Error al crear plan")
          : "Error al crear plan",
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Crear plan</h1>
        <p className="text-muted-foreground">
          Define un nuevo plan para asignarlo a los usuarios
        </p>
      </div>

      <PlanForm
        onSubmit={onSubmit}
        onCancel={() => router.push("/dashboard/admin/plans")}
        isSubmitting={createPlanMutation.isPending}
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
