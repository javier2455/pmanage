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
import {
  Store,
  Building2,
  MapPin,
  Mail,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { sileo } from "sileo";
import { BusinessLocationStep } from "@/components/business/business-location-step";
import { cn } from "@/lib/utils";

const businessTypes = [
  { value: "mipyme", label: "MiPyme" },
  { value: "agromarket", label: "Agromercado" },
  { value: "market", label: "Mercado" },
] as const;

const HAVANA_LAT = 23.1444;
const HAVANA_LNG = -82.3855;

const STEP_FIELDS_INFO = [
  "name",
  "type",
  "address",
  "municipalityId",
  "description",
  "phone",
  "email",
] as const satisfies readonly (keyof CreateBusinessFormData)[];

type Step = "info" | "location";

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "info", label: "Datos del negocio" },
    { id: "location", label: "Ubicación" },
  ];

  return (
    <div className="flex items-center gap-3">
      {steps.map((s, idx) => {
        const isActive = s.id === step;
        const isCompleted = step === "location" && s.id === "info";
        return (
          <div key={s.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                  isActive || isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {idx + 1}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "h-px w-8",
                  isCompleted ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CreateBusinessPage() {
  const router = useRouter();
  const createBusinessMutation = useCreateBusinessMutation();
  const { businesses, isLoading: isLoadingBusinesses } = useBusiness();
  const { isProPlan } = useUserRoleAndPlan();
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [step, setStep] = useState<Step>("info");

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

  const { data: provincesData, isLoading: isLoadingProvinces } =
    useGetAllProvinces();
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
    trigger,
    watch,
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
      lat: HAVANA_LAT,
      lng: HAVANA_LNG,
    },
  });

  const lat = watch("lat");
  const lng = watch("lng");
  const watchedAddress = watch("address");
  const watchedMunicipalityId = watch("municipalityId");

  const selectedProvinceName =
    provinces.find((p) => String(p.id) === selectedProvinceId)?.name ?? null;
  const selectedMunicipalityName =
    municipalities.find((m) => String(m.id) === watchedMunicipalityId)?.name ??
    null;

  const handleLocationChange = (newLat: number, newLng: number) => {
    setValue("lat", newLat, { shouldValidate: true, shouldDirty: true });
    setValue("lng", newLng, { shouldValidate: true, shouldDirty: true });
  };

  const handleContinue = async () => {
    const isValid = await trigger(STEP_FIELDS_INFO);
    if (!isValid) return;
    setStep("location");
  };

  const onSubmit = async (data: CreateBusinessFormData) => {
    try {
      const payload = {
        ...data,
        description: data.description || null,
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
          description:
            error.response?.data?.message ?? "Error al crear el negocio",
          styles: {
            description: "text-[#dc2626]/90! text-[15px]!",
          },
        });
        setError("root", {
          message:
            error.response?.data?.message ?? "Error al crear el negocio.",
        });
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

      <StepIndicator step={step} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
        className="flex flex-col gap-5"
      >
        {step === "info" && (
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
              <div className="flex flex-col gap-5">
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
                        setValue(
                          "type",
                          value as CreateBusinessFormData["type"],
                          {
                            shouldValidate: true,
                          },
                        )
                      }
                    >
                      <SelectTrigger
                        id="type"
                        aria-invalid={!!errors.type}
                        className="w-full"
                      >
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
                        setValue("municipalityId", "", {
                          shouldValidate: false,
                        });
                      }}
                    >
                      <SelectTrigger
                        id="province"
                        disabled={isLoadingProvinces}
                        className="w-full"
                      >
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
                    <Label
                      htmlFor="municipality"
                      className="text-card-foreground"
                    >
                      Municipio
                    </Label>
                    <Select
                      disabled={!selectedProvinceId || isLoadingMunicipalities}
                      onValueChange={(value) =>
                        setValue("municipalityId", value, {
                          shouldValidate: true,
                        })
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
              </div>
            </CardContent>
          </Card>
        )}

        {step === "location" && (
          <BusinessLocationStep
            lat={lat}
            lng={lng}
            onLocationChange={handleLocationChange}
            manualAddress={watchedAddress}
            provinceName={selectedProvinceName}
            municipalityName={selectedMunicipalityName}
            onAddressSuggestion={(address) =>
              setValue("address", address, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
        )}

        {errors.root && (
          <p className="text-sm text-destructive" role="alert">
            {errors.root.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {step === "info" && businesses.length > 0 && (
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

          {step === "location" && (
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={() => setStep("info")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          )}

          {step === "info" ? (
            <Button type="button" onClick={handleContinue}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={createBusinessMutation.isPending}
            >
              {createBusinessMutation.isPending
                ? "Creando negocio..."
                : "Crear negocio"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
