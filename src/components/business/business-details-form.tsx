"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateBusinessSchema,
  isDialCodeOnly,
  type UpdateBusinessFormData,
} from "@/lib/validations/business";
import { useUpdateBusinessMutation } from "@/hooks/use-business";
import {
  useGetAllProvinces,
  useGetAllMunicipalitiesByProvinceId,
} from "@/hooks/use-search";
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
  Phone,
  Mail,
  Pencil,
  X,
  Save,
  Tags,
  Truck,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/phone-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/context/business-context";
import { sileo } from "sileo";
import axios from "axios";
import { BusinessType } from "@/lib/types/business";
import { LocationMap } from "@/components/business/location-map";
import { BusinessLocationStep } from "@/components/business/business-location-step";

const HAVANA_LAT = 23.1444;
const HAVANA_LNG = -82.3855;

function toCoord(value: unknown, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

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

export function BusinessDetailsForm() {
  const { activeBusiness, activeBusinessId } = useBusiness();
  const updateBusinessMutation = useUpdateBusinessMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [resolvedProvinceName, setResolvedProvinceName] = useState<string | null>(null);
  const [resolvedMunicipalityName, setResolvedMunicipalityName] = useState<string | null>(null);

  const { data: provincesData, isLoading: isLoadingProvinces } = useGetAllProvinces();
  const { data: municipalitiesData, isLoading: isLoadingMunicipalities } =
    useGetAllMunicipalitiesByProvinceId(selectedProvinceId);

  const provinces = useMemo(() => provincesData?.data ?? [], [provincesData]);
  const municipalities = municipalitiesData?.data ?? [];

  useEffect(() => {
    // El nombre del municipio sale del objeto anidado `municipality` que
    // devuelve `GET /businesses/my-businesses`. Si el backend aún no lo incluye
    // (ver docs/backend/my-businesses-municipality-relation.md), `municipality`
    // llega null y tanto provincia como municipio quedan vacíos.
    const mun = activeBusiness?.municipality;
    if (!mun) return;

    setResolvedMunicipalityName(mun.name);
    // `provinceId` se normaliza a string: el backend puede mandarlo como número
    // y el catálogo de provincias usa `id` numérico.
    const provinceId = String(mun.provinceId);
    setSelectedProvinceId(provinceId);

    if (provinces.length === 0) return;
    const province = provinces.find((p) => String(p.id) === provinceId);
    if (province) setResolvedProvinceName(province.name);
  }, [activeBusiness?.municipality, provinces]);

  useEffect(() => {
    if (!selectedProvinceId || provinces.length === 0) return;
    const province = provinces.find(
      (p) => String(p.id) === String(selectedProvinceId),
    );
    if (province) setResolvedProvinceName(province.name);
  }, [selectedProvinceId, provinces]);

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
      acceptsMessaging: activeBusiness?.acceptsMessaging ?? false,
      municipalityId: activeBusiness?.municipality?.id ?? activeBusiness?.municipalityId ?? "",
      lat: toCoord(activeBusiness?.lat, HAVANA_LAT),
      lng: toCoord(activeBusiness?.lng, HAVANA_LNG),
    },
  });

  const selectedType = watch("type");
  const watchedAcceptsMessaging = watch("acceptsMessaging");
  const watchedLat = toCoord(watch("lat"), toCoord(activeBusiness?.lat, HAVANA_LAT));
  const watchedLng = toCoord(watch("lng"), toCoord(activeBusiness?.lng, HAVANA_LNG));
  const watchedAddress = watch("address");
  const watchedMunicipalityId = watch("municipalityId");

  const editingMunicipalityName =
    municipalities.find((m) => String(m.id) === watchedMunicipalityId)?.name ??
    resolvedMunicipalityName;

  const handleLocationChange = (newLat: number, newLng: number) => {
    setValue("lat", newLat, { shouldDirty: true });
    setValue("lng", newLng, { shouldDirty: true });
  };

  function handleEdit() {
    reset({
      name: activeBusiness?.name ?? "",
      description: activeBusiness?.description ?? "",
      type: (activeBusiness?.type as BusinessType) ?? "mipyme",
      address: activeBusiness?.address ?? "",
      phone: activeBusiness?.phone ?? "",
      email: activeBusiness?.email ?? "",
      acceptsMessaging: activeBusiness?.acceptsMessaging ?? false,
      municipalityId: activeBusiness?.municipality?.id ?? activeBusiness?.municipalityId ?? "",
      lat: toCoord(activeBusiness?.lat, HAVANA_LAT),
      lng: toCoord(activeBusiness?.lng, HAVANA_LNG),
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
          phone: data.phone && !isDialCodeOnly(data.phone) ? data.phone : null,
          email: data.email || null,
          acceptsMessaging: data.acceptsMessaging,
          municipalityId: data.municipalityId || undefined,
          lat: data.lat,
          lng: data.lng,
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
    <>
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

            {/* Provincia / Municipio */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="province" className="text-card-foreground">
                  Provincia
                </Label>
                {isEditing ? (
                  <Select
                    value={selectedProvinceId}
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
                        <SelectItem key={province.id} value={String(province.id)}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : isLoadingProvinces ? (
                  <Skeleton className="h-9 w-full rounded-md" />
                ) : (
                  <EditableFieldWrapper>
                    <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {resolvedProvinceName ?? "-"}
                      </span>
                    </div>
                  </EditableFieldWrapper>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="municipality" className="text-card-foreground">
                  Municipio
                </Label>
                {isEditing ? (
                  <>
                    <Select
                      value={watchedMunicipalityId ?? ""}
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
                          <SelectItem key={municipality.id} value={String(municipality.id)}>
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
                  </>
                ) : isLoadingProvinces ? (
                  <Skeleton className="h-9 w-full rounded-md" />
                ) : (
                  <EditableFieldWrapper>
                    <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                      <MapPin className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {resolvedMunicipalityName ?? "-"}
                      </span>
                    </div>
                  </EditableFieldWrapper>
                )}
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

            {/* Delivery */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="acceptsMessaging" className="text-card-foreground">
                Delivery
              </Label>
              {isEditing ? (
                <div className="flex items-start justify-between gap-4 rounded-md border border-input p-3">
                  <div className="flex items-start gap-2">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Aceptar pedidos a domicilio. Los clientes podrán pedir
                      entrega a domicilio.
                    </span>
                  </div>
                  <Switch
                    id="acceptsMessaging"
                    checked={watchedAcceptsMessaging ?? false}
                    onCheckedChange={(checked) =>
                      setValue("acceptsMessaging", checked, { shouldDirty: true })
                    }
                  />
                </div>
              ) : (
                <EditableFieldWrapper>
                  <div className="relative flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2 pr-8">
                    <Truck className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {activeBusiness?.acceptsMessaging
                        ? "Activado"
                        : "Desactivado"}
                    </span>
                  </div>
                </EditableFieldWrapper>
              )}
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">Ubicación</CardTitle>
              <CardDescription>
                {isEditing
                  ? "Arrastra el marcador o haz clic en el mapa para ajustar la ubicación"
                  : "Ubicación actual del negocio en el mapa"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <BusinessLocationStep
              lat={watchedLat}
              lng={watchedLng}
              onLocationChange={handleLocationChange}
              manualAddress={watchedAddress}
              provinceName={resolvedProvinceName}
              municipalityName={editingMunicipalityName}
              onAddressSuggestion={(address) =>
                setValue("address", address, { shouldValidate: true, shouldDirty: true })
              }
            />
          ) : activeBusiness?.lat != null && activeBusiness?.lng != null ? (
            <LocationMap
              lat={toCoord(activeBusiness.lat, HAVANA_LAT)}
              lng={toCoord(activeBusiness.lng, HAVANA_LNG)}
              readOnly
              className="w-full h-80 rounded-lg border border-border overflow-hidden"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Este negocio aún no tiene una ubicación fijada en el mapa. Edita el negocio para añadirla.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
