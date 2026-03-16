"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBusinessSchema,
  type UpdateBusinessFormData,
} from "@/lib/validations/business";
import { useUpdateBusinessMutation } from "@/hooks/use-business";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Store, Building2, MapPin, Phone, Mail, Pencil, X, Save } from "lucide-react";
import { useBusiness } from "@/context/business-context";
import { sileo } from "sileo";
import axios from "axios";

const businessTypeLabels: Record<string, string> = {
  mipyme: "MiPyme",
  agromarket: "Agromercado",
  market: "Mercado",
};

export default function BusinessDetailsPage() {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const updateBusinessMutation = useUpdateBusinessMutation();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBusinessFormData>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: {
      name: activeBusiness?.name ?? "",
      description: activeBusiness?.description ?? "",
      address: activeBusiness?.address ?? "",
      phone: activeBusiness?.phone ?? "",
      email: activeBusiness?.email ?? "",
    },
  });

  function handleEdit() {
    reset({
      name: activeBusiness?.name ?? "",
      description: activeBusiness?.description ?? "",
      address: activeBusiness?.address ?? "",
      phone: activeBusiness?.phone ?? "",
      email: activeBusiness?.email ?? "",
    });
    setIsEditing(true);
  }

  function handleCancel() {
    reset();
    setIsEditing(false);
  }

  const onSubmit = async (data: UpdateBusinessFormData) => {
    if (!activeBusinessId) return;

    try {
      await updateBusinessMutation.mutateAsync({
        businessId: activeBusinessId,
        payload: {
          name: data.name,
          description: data.description || null,
          address: data.address,
          phone: data.phone || null,
          email: data.email || null,
        },
      });

      sileo.success({
        title: "Negocio actualizado correctamente",
        description: "Los datos del negocio han sido guardados",
        fill: "",
        styles: {
          title: "text-white! text-[16px]! font-bold!",
          description: "text-white/90! text-[15px]!",
        },
      });
      setIsEditing(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          description: error.response?.data?.message ?? "Error al actualizar el negocio",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        });
      } else {
        sileo.error({
          title: "Error",
          description: "Error al actualizar el negocio. Intenta de nuevo.",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        });
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Detalles del negocio
        </h1>
        <p className="text-muted-foreground">
          Información del negocio actual
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Datos del negocio
                </CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Modifica los campos que deseas actualizar"
                    : "Información registrada de tu negocio"}
                </CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Nombre */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-card-foreground">
                  Nombre del negocio
                </Label>
                {isEditing ? (
                  <>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Ej: Mi Tienda"
                        {...register("name")}
                        aria-invalid={!!errors.name}
                        className="pl-9"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <span className="pl-6 text-sm text-foreground">
                      {activeBusiness?.name ?? "-"}
                    </span>
                  </div>
                )}
              </div>

              {/* Tipo (solo lectura siempre) */}
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Tipo de negocio
                </Label>
                <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">
                    {activeBusiness?.type
                      ? businessTypeLabels[activeBusiness.type] ?? activeBusiness.type
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="text-card-foreground">
                Dirección
              </Label>
              {isEditing ? (
                <>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Calle, número, ciudad"
                      {...register("address")}
                      aria-invalid={!!errors.address}
                      className="pl-9"
                    />
                  </div>
                  {errors.address && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.address.message}
                    </p>
                  )}
                </>
              ) : (
                <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <span className="pl-6 text-sm text-foreground">
                    {activeBusiness?.address ?? "-"}
                  </span>
                </div>
              )}
            </div>

            {/* Provincia / Municipio (solo lectura siempre) */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">Provincia</Label>
                <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">-</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">Municipio</Label>
                <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">-</span>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-card-foreground">
                Descripción{" "}
                {isEditing && (
                  <span className="font-normal text-muted-foreground">(opcional)</span>
                )}
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="description"
                    type="text"
                    placeholder="Breve descripción de tu negocio"
                    {...register("description")}
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.description.message}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                  <span className="text-sm text-foreground">
                    {activeBusiness?.description ?? "-"}
                  </span>
                </div>
              )}
            </div>

            {/* Teléfono / Correo */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-card-foreground">
                  Teléfono{" "}
                  {isEditing && (
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  )}
                </Label>
                {isEditing ? (
                  <>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+53 5555 5555"
                        {...register("phone")}
                        aria-invalid={!!errors.phone}
                        className="pl-9"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.phone.message}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <span className="pl-6 text-sm text-foreground">
                      {activeBusiness?.phone ?? "-"}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo{" "}
                  {isEditing && (
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  )}
                </Label>
                {isEditing ? (
                  <>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="contacto@minegocio.com"
                        {...register("email")}
                        aria-invalid={!!errors.email}
                        className="pl-9"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <span className="pl-6 text-sm text-foreground">
                      {activeBusiness?.email ?? "-"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateBusinessMutation.isPending}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateBusinessMutation.isPending}>
                  <Save className="h-4 w-4" />
                  {updateBusinessMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
