"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createBusinessSchema,
  type CreateBusinessFormData,
} from "@/lib/validations/business";
import { useCreateBusinessMutation } from "@/hooks/use-business";
import { useBusiness } from "@/context/business-context";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import {
  useGetAllProvinces,
  useGetAllMunicipalitiesByProvinceId,
} from "@/hooks/use-search";
import { useRouter } from "next/navigation";
import axios from "axios";
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
import { Store, Building2, MapPin, Mail, X } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { sileo } from "sileo";

const businessTypes = [
  { value: "mipyme", label: "MiPyme" },
  { value: "agromarket", label: "Agromercado" },
  { value: "market", label: "Mercado" },
] as const;

export default function CreateBusinessPage() {
  const router = useRouter();
  const createBusinessMutation = useCreateBusinessMutation();
  const { businesses, isLoading: isLoadingBusinesses } = useBusiness();
  const { isProPlan } = useUserRoleAndPlan();
  const [selectedProvinceId, setSelectedProvinceId] = useState("");

  useEffect(() => {
    if (isLoadingBusinesses) return;
    if (!isProPlan && businesses.length >= 1) {
      sileo.error({
        title: "Plan requerido",
        description:
          "Solo usuarios con plan Pro pueden crear más de un negocio. Actualiza tu plan para desbloquear esta función.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
      router.replace("/dashboard");
    }
  }, [isProPlan, businesses.length, isLoadingBusinesses, router]);

  const { data: provincesData, isLoading: isLoadingProvinces } = useGetAllProvinces();
  const { data: municipalitiesData, isLoading: isLoadingMunicipalities } =
    useGetAllMunicipalitiesByProvinceId(selectedProvinceId);

  const provinces = provincesData?.data ?? [];
  const municipalities = municipalitiesData?.data ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateBusinessFormData>({
    resolver: zodResolver(createBusinessSchema),
    defaultValues: {
      name: "",
      description: "",
      type: undefined,
      address: "",
      phone: "",
      email: "",
      municipalityId: "",
    },
  });

  const onSubmit = async (data: CreateBusinessFormData) => {
    try {
      const payload = {
        ...data,
        description: data.description || null,
        phone: data.phone || null,
        email: data.email || null,
      };

      await createBusinessMutation.mutateAsync(payload);
      sileo.success({
        title: "Negocio creado correctamente",
        description: "Tu negocio ha sido registrado exitosamente",
        fill: "",
        styles: {
          title: "text-white! text-[16px]! font-bold!",
          description: "text-white/90! text-[15px]!",
        },
      });
      router.push("/dashboard");
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          description: error.response?.data?.message ?? "Error al crear el negocio",
          styles: {
            description: "text-[#dc2626]/90! text-[15px]!",
          },
        });
        setError("root", { message: error.response?.data?.message ?? "Error al crear el negocio." });
      } else {
        sileo.error({
          title: "Error",
          description: "Error al crear el negocio. Intenta de nuevo.",
          styles: {
            description: "text-[#dc2626]/90! text-[15px]!",
          },
        });
        setError("root", {
          message: "Error al crear el negocio. Intenta de nuevo.",
        });
      }
    }
  };

  if (!isProPlan && businesses.length >= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {businesses.length === 0 ? "Crea tu primer negocio" : "Crear negocio"}
        </h1>
        <p className="text-muted-foreground">
          {businesses.length === 0
            ? "Registra tu negocio para comenzar a usar la plataforma"
            : "Registra tu negocio para comenzar a gestionar productos, ventas e inventario"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Store className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Nuevo negocio
              </CardTitle>
              <CardDescription>
                Completa la información de tu negocio
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-card-foreground">
                  Nombre del negocio
                </Label>
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
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="type" className="text-card-foreground">
                  Tipo de negocio
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue("type", value as CreateBusinessFormData["type"], {
                      shouldValidate: true,
                    })
                  }

                >
                  <SelectTrigger id="type" aria-invalid={!!errors.type} className="w-full">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>
                        {bt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.type.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="text-card-foreground">
                Dirección
              </Label>
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
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="province" className="text-card-foreground">
                  Provincia
                </Label>
                <Select
                  onValueChange={(value) => {
                    setSelectedProvinceId(value);
                    setValue("municipalityId", "", { shouldValidate: false });
                  }}
                >
                  <SelectTrigger id="province" disabled={isLoadingProvinces} className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingProvinces
                          ? "Cargando..."
                          : "Selecciona una provincia"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem
                        key={province.id}
                        value={String(province.id)}
                      >
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="municipality" className="text-card-foreground">
                  Municipio
                </Label>
                <Select
                  disabled={!selectedProvinceId || isLoadingMunicipalities}
                  onValueChange={(value) =>
                    setValue("municipalityId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    id="municipality"
                    aria-invalid={!!errors.municipalityId}
                    className="w-full"
                  >
                    <SelectValue
                      placeholder={
                        !selectedProvinceId
                          ? "Selecciona una provincia primero"
                          : isLoadingMunicipalities
                            ? "Cargando..."
                            : "Selecciona un municipio"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {municipalities.map((municipality) => (
                      <SelectItem
                        key={municipality.id}
                        value={String(municipality.id)}
                      >
                        {municipality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.municipalityId && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.municipalityId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-card-foreground">
                Descripción{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
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
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-card-foreground">
                  Teléfono{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
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
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Correo{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
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
              </div>
            </div>

            {errors.root && (
              <p className="text-sm text-destructive" role="alert">
                {errors.root.message}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {businesses.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => {
                    reset();
                    setSelectedProvinceId("");
                    router.push("/dashboard/business/details");
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              )}
              <Button
                type="submit"
                disabled={createBusinessMutation.isPending}
              >
                {createBusinessMutation.isPending
                  ? "Creando negocio..."
                  : "Crear negocio"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
