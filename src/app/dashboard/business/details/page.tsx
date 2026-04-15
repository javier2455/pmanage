"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBusinessSchema,
  type UpdateBusinessFormData,
} from "@/lib/validations/business";
import { useUpdateBusinessMutation, useDeleteBusinessMutation } from "@/hooks/use-business";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Building2, MapPin, Phone, Mail, Pencil, X, Save, Tags, Trash2, TriangleAlert } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { DeleteDialog } from "@/components/delete-dialog";
import { useBusiness } from "@/context/business-context";
import { sileo } from "sileo";
import axios from "axios";
import { BusinessType } from "@/lib/types/business";

const businessTypeLabels: Record<string, string> = {
  mipyme: "MiPyme",
  agromarket: "Agromercado",
  market: "Mercado",
};

function EditableFieldWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-primary/25" />
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        <Pencil className="h-3 w-3 text-primary/50" />
      </div>
      {children}
    </div>
  );
}

export default function BusinessDetailsPage() {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const updateBusinessMutation = useUpdateBusinessMutation();
  const deleteBusinessMutation = useDeleteBusinessMutation();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<UpdateBusinessFormData>({
    resolver: zodResolver(updateBusinessSchema),
    defaultValues: {
      name: activeBusiness?.name ?? "",
      description: activeBusiness?.description ?? "",
      type: (activeBusiness?.type as BusinessType) ?? "mipyme",
      address: activeBusiness?.address ?? "",
      phone: activeBusiness?.phone ?? "",
      email: activeBusiness?.email ?? "",
    },
  });

  const selectedType = watch("type");

  function handleEdit() {
    reset({
      name: activeBusiness?.name ?? "",
      description: activeBusiness?.description ?? "",
      type: (activeBusiness?.type as BusinessType) ?? "mipyme",
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
          type: data.type,
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
                    : "Los campos con el indicador pueden editarse"}
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
                  <EditableFieldWrapper>
                    <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {activeBusiness?.name ?? "-"}
                      </span>
                    </div>
                  </EditableFieldWrapper>
                )}
              </div>

              {/* Tipo de negocio */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="type" className="text-card-foreground">
                  Tipo de negocio
                </Label>
                {isEditing ? (
                  <>
                    <Select
                      value={selectedType}
                      onValueChange={(val) => setValue("type", val as BusinessType)}
                    >
                      <SelectTrigger id="type" aria-invalid={!!errors.type} className="w-full">
                        <div className="flex items-center gap-2">
                          <Tags className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Selecciona un tipo" />
                        </div>
                      </SelectTrigger>
                      <SelectContent align="start" position="popper">
                        <SelectItem value="mipyme">MiPyme</SelectItem>
                        <SelectItem value="agromarket">Agromercado</SelectItem>
                        <SelectItem value="market">Mercado</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.type.message}
                      </p>
                    )}
                  </>
                ) : (
                  <EditableFieldWrapper>
                    <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <Tags className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {activeBusiness?.type
                          ? businessTypeLabels[activeBusiness.type] ?? activeBusiness.type
                          : "-"}
                      </span>
                    </div>
                  </EditableFieldWrapper>
                )}
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
                <EditableFieldWrapper>
                  <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                    <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {activeBusiness?.address ?? "-"}
                    </span>
                  </div>
                </EditableFieldWrapper>
              )}
            </div>

            {/* Provincia / Municipio (solo lectura) */}
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
                <EditableFieldWrapper>
                  <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                    <span className="text-sm text-foreground">
                      {activeBusiness?.description ?? "-"}
                    </span>
                  </div>
                </EditableFieldWrapper>
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
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          defaultCountry="cu"
                          placeholder="5555 5555"
                          aria-invalid={!!errors.phone}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.phone.message}
                      </p>
                    )}
                  </>
                ) : (
                  <EditableFieldWrapper>
                    <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <Phone className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {activeBusiness?.phone ?? "-"}
                      </span>
                    </div>
                  </EditableFieldWrapper>
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
                  <EditableFieldWrapper>
                    <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <Mail className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {activeBusiness?.email ?? "-"}
                      </span>
                    </div>
                  </EditableFieldWrapper>
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

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10">
              <TriangleAlert className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">Zona de peligro</CardTitle>
              <CardDescription>
                Las acciones de esta sección son irreversibles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium text-card-foreground">
                Eliminar negocio
              </p>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente este negocio y todos sus datos asociados.
              </p>
            </div>
            <DeleteDialog
              deleteType="Negocio"
              name={activeBusiness?.name ?? ""}
              onConfirm={async () => {
                if (!activeBusinessId) return;
                try {
                  await deleteBusinessMutation.mutateAsync(activeBusinessId);
                  sileo.success({
                    title: "Negocio eliminado",
                    description: "El negocio ha sido eliminado correctamente",
                    fill: "",
                    styles: {
                      title: "text-white! text-[16px]! font-bold!",
                      description: "text-white/90! text-[15px]!",
                    },
                  });
                } catch (error) {
                  if (axios.isAxiosError(error)) {
                    sileo.error({
                      title: error.response?.data?.error ?? "Error",
                      description: error.response?.data?.message ?? "No se pudo eliminar el negocio",
                      styles: { description: "text-[#dc2626]/90! text-[15px]!" },
                    });
                  }
                }
              }}
              trigger={
                <Button variant="destructive" size="sm" className="shrink-0">
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
