"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { sileo } from "sileo";
import { BadgeDollarSign, Plus, X } from "lucide-react";
import { useCreatePlanMutation } from "@/hooks/use-plans";
import { createPlanSchema, type CreatePlanFormData, type CreatePlanFormInput } from "@/lib/validations/plans";
import type { PlanType } from "@/lib/types/plans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const planTypeOptions = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Básico" },
  { value: "premium", label: "Premium" },
  { value: "enterprise", label: "Enterprise" },
] as const;

export default function CreatePlanPage() {
  const router = useRouter();
  const createPlanMutation = useCreatePlanMutation();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<CreatePlanFormInput, unknown, CreatePlanFormData>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "basic",
      price: null,
      maxProducts: 1,
      isActive: true,
    },
  });

  const selectedType = useWatch({ control, name: "type" });
  const isActive = useWatch({ control, name: "isActive" });

  async function onSubmit(data: CreatePlanFormData) {

    try {
      await createPlanMutation.mutateAsync({
        ...data,
        name: data.name.trim(),
        type: data.type,
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

      router.push("/dashboard/admin/assign-plans");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: error.response?.data?.message ?? "Error al crear plan." });
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          description: error.response?.data?.message,
          styles: {
            title: "text-foreground! text-[16px]! font-bold!",
            description: "text-destructive! text-[15px]!",
          },
        });
      } else {
        setError("root", { message: "No se pudo crear el plan. Intenta de nuevo." });
        sileo.error({
          title: "Error al crear plan",
          description: "No se pudo crear el plan. Intenta de nuevo.",
          styles: {
            title: "text-foreground! text-[16px]! font-bold!",
            description: "text-destructive! text-[15px]!",
          },
        });
      }
    }
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Crear plan</h1>
        <p className="text-muted-foreground">Define un nuevo plan para asignarlo a los usuarios</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <BadgeDollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">Nuevo plan</CardTitle>
              <CardDescription>Completa la informacion del plan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit, () => {
              sileo.error({
                title: "Revisa el formulario",
                description: "Completa todos los campos requeridos correctamente",
                styles: {
                  title: "text-foreground! text-[16px]! font-bold!",
                  description: "text-destructive! text-[15px]!",
                },
              });
            })}
            className="flex flex-col gap-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej: Plan Pro"
                  {...register("name")}
                  aria-invalid={errors.name ? "true" : "false"}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setValue("type", value as PlanType, { shouldValidate: true })}
                >
                  <SelectTrigger id="type" className="w-full" aria-invalid={errors.type ? "true" : "false"}>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {planTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">
                  Precio 
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", {
                    setValueAs: (value) => (value === "" ? null : Number(value)),
                  })}
                  aria-invalid={errors.price ? "true" : "false"}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="maxProducts">Maximo de productos</Label>
                <Input
                  id="maxProducts"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="100"
                  {...register("maxProducts", {
                    setValueAs: (value) => Number(value),
                  })}
                  aria-invalid={errors.maxProducts ? "true" : "false"}
                />
                {errors.maxProducts && (
                  <p className="text-sm text-destructive">{errors.maxProducts.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">
                Descripcion <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="description"
                placeholder="Describe brevemente este plan"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", !!checked, { shouldValidate: true })}
                className="mt-0.5"
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="isActive" className="cursor-pointer text-sm font-medium text-card-foreground">
                  Plan activo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si esta activo, se podra asignar inmediatamente a los usuarios.
                </p>
              </div>
            </div>

            {errors.root && (
              <p className="text-sm text-destructive" role="alert">
                {errors.root.message}
              </p>
            )}

            <Separator />

            <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="bg-transparent"
                onClick={() => router.push("/dashboard/admin/assign-plans")}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? (
                  "Creando plan..."
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear plan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
