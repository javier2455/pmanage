"use client";

import { useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeDollarSign, Info, Plus, Save, X } from "lucide-react";

import { planFormSchema, type PlanFormData, type PlanFormInput } from "@/lib/validations/plans";
import type { PlanResponse, PlanType } from "@/lib/types/plans";
import {
  PLAN_FEATURE_GROUPS,
  PLAN_FEATURE_KEYS,
  featuresByGroup,
  normalizeFeatures,
  type PlanFeatureDefinition,
  type PlanFeatureGroup,
  type PlanFeatureKey,
} from "@/lib/plan-features";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Textarea } from "@/components/ui/textarea";

/** Familias de plan y el orden con que se sugieren en la vitrina. */
const planTypeOptions = [
  { value: "free", label: "Free", order: 0 },
  { value: "basic", label: "Básico", order: 1 },
  { value: "premium", label: "Premium", order: 2 },
  { value: "enterprise", label: "Enterprise", order: 3 },
] as const;

/**
 * Los tres topes se editan igual: un número, o "sin límite" marcando la casilla.
 * `null` es lo que el backend entiende por ilimitado, así que la casilla no es
 * azúcar de interfaz — es la única forma de expresar esa intención.
 */
type LimitFieldName = "maxProducts" | "maxBusinesses" | "maxWorkers";

function LimitField({
  name,
  label,
  hint,
  min,
  control,
  setValue,
  error,
}: {
  name: LimitFieldName;
  label: string;
  hint: string;
  min: number;
  control: Control<PlanFormInput>;
  setValue: UseFormSetValue<PlanFormInput>;
  error?: string;
}) {
  const value = useWatch({ control, name }) as number | null;
  const isUnlimited = value === null;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        min={min}
        step={1}
        disabled={isUnlimited}
        value={isUnlimited ? "" : (value ?? "")}
        placeholder={isUnlimited ? "Sin límite" : String(min)}
        onChange={(e) =>
          setValue(name, e.target.value === "" ? null : Number(e.target.value), {
            shouldValidate: true,
          })
        }
        aria-invalid={error ? "true" : "false"}
      />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox
          checked={isUnlimited}
          onCheckedChange={(checked) =>
            setValue(name, checked ? null : min, { shouldValidate: true })
          }
        />
        Sin límite
      </label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Detalle de qué hace la capacidad en el sistema. Va en popover y no como texto
 * fijo porque son 19 casillas: al pie de cada una, la sección dejaría de poder
 * leerse de un vistazo.
 */
function FeatureInfo({ feature }: { feature: PlanFeatureDefinition }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ml-auto shrink-0 cursor-pointer rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Qué hace: ${feature.label}`}
        >
          <Info className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{feature.label}</PopoverTitle>
          <PopoverDescription className="text-xs">
            {feature.description}
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

/** Valores de partida de un plan nuevo: nada concedido y ningún tope implícito. */
function emptyPlanValues(): PlanFormInput {
  return {
    code: "",
    name: "",
    description: "",
    type: "basic",
    currency: "USD",
    priceMonthly: 0,
    priceYearly: 0,
    maxProducts: 100,
    maxBusinesses: 1,
    maxWorkers: 0,
    features: normalizeFeatures(null),
    isActive: true,
    isPublic: true,
    displayOrder: 0,
  };
}

function planToFormValues(plan: PlanResponse): PlanFormInput {
  return {
    code: plan.code,
    name: plan.name,
    description: plan.description ?? "",
    type: plan.type as PlanType,
    currency: plan.currency ?? "USD",
    priceMonthly: Number(plan.priceMonthly ?? 0),
    priceYearly: Number(plan.priceYearly ?? 0),
    maxProducts: plan.maxProducts,
    maxBusinesses: plan.maxBusinesses,
    maxWorkers: plan.maxWorkers,
    features: normalizeFeatures(plan.features),
    isActive: plan.isActive,
    isPublic: plan.isPublic ?? true,
    displayOrder: plan.displayOrder ?? 0,
  };
}

export type PlanFormProps = {
  /** Plan a editar. Ausente = alta. */
  plan?: PlanResponse;
  onSubmit: (data: PlanFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  /** Error de servidor a mostrar bajo el formulario. */
  serverError?: string | null;
  onInvalid?: () => void;
};

export function PlanForm({
  plan,
  onSubmit,
  onCancel,
  isSubmitting,
  serverError,
  onInvalid,
}: PlanFormProps) {
  const isEditing = Boolean(plan);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PlanFormInput, unknown, PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan ? planToFormValues(plan) : emptyPlanValues(),
  });

  const selectedType = useWatch({ control, name: "type" });
  const isActive = useWatch({ control, name: "isActive" });
  const isPublic = useWatch({ control, name: "isPublic" });
  const features = useWatch({ control, name: "features" });
  const priceMonthly = useWatch({ control, name: "priceMonthly" });
  const currency = useWatch({ control, name: "currency" });

  /**
   * El tipo determina el nivel de servicio del plan, así que también sugiere su
   * posición en la vitrina. Sigue siendo editable: el orden es presentación.
   */
  function handleTypeChange(value: string) {
    const option = planTypeOptions.find((o) => o.value === value);
    setValue("type", value as PlanType, { shouldValidate: true });
    if (option) {
      setValue("displayOrder", option.order, { shouldValidate: true });
    }
  }

  function toggleFeature(key: PlanFeatureKey, checked: boolean) {
    setValue(`features.${key}`, checked, { shouldValidate: true });
  }

  /** Marca o desmarca de golpe todas las capacidades del catálogo. */
  function setAllFeatures(granted: boolean) {
    for (const key of PLAN_FEATURE_KEYS) {
      setValue(`features.${key}`, granted, { shouldValidate: true });
    }
  }

  /** Lo mismo, limitado a un grupo (la tarjeta donde está el botón). */
  function setGroupFeatures(group: PlanFeatureGroup, granted: boolean) {
    for (const feature of featuresByGroup(group)) {
      setValue(`features.${feature.key}`, granted, { shouldValidate: true });
    }
  }

  /* El botón alterna: si ya está todo concedido, sirve para quitarlo. Así una
     sola acción cubre los dos casos en vez de pedir dos controles. */
  const allGranted = PLAN_FEATURE_KEYS.every((key) => features?.[key] === true);

  const yearlyEquivalent =
    priceMonthly > 0 ? (priceMonthly * 12).toFixed(2) : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <BadgeDollarSign className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">
              {isEditing ? `Editar ${plan!.name}` : "Nuevo plan"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Los cambios afectan a los usuarios que ya tienen este plan"
                : "Completa la informacion del plan"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="flex flex-col gap-6"
        >
          {/* ---------- Identidad ---------- */}
          <section className="flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-card-foreground">Identidad</h3>

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
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  placeholder="Ej: pro-anual"
                  {...register("code")}
                  aria-invalid={errors.code ? "true" : "false"}
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único y estable. No se muestra a los usuarios.
                </p>
                {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={selectedType} onValueChange={handleTypeChange}>
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

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">
                Descripcion <span className="font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                rows={2}
                placeholder="Describe brevemente este plan"
                {...register("description", {
                  setValueAs: (v) => (v === "" ? null : v),
                })}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </section>

          <Separator />

          {/* ---------- Precio ---------- */}
          <section className="flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-card-foreground">Precio</h3>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  placeholder="USD"
                  {...register("currency", {
                    setValueAs: (v) => String(v ?? "").toUpperCase(),
                  })}
                  aria-invalid={errors.currency ? "true" : "false"}
                />
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="priceMonthly">Precio mensual</Label>
                <Input
                  id="priceMonthly"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  {...register("priceMonthly", {
                    setValueAs: (v) => (v === "" ? 0 : Number(v)),
                  })}
                  aria-invalid={errors.priceMonthly ? "true" : "false"}
                />
                {errors.priceMonthly && (
                  <p className="text-sm text-destructive">{errors.priceMonthly.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="priceYearly">Precio anual</Label>
                <Input
                  id="priceYearly"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  {...register("priceYearly", {
                    setValueAs: (v) => (v === "" ? 0 : Number(v)),
                  })}
                  aria-invalid={errors.priceYearly ? "true" : "false"}
                />
                <p className="text-xs text-muted-foreground">
                  Importe total del año
                  {yearlyEquivalent
                    ? `. Sin descuento serían ${yearlyEquivalent} ${currency}`
                    : ""}
                </p>
                {errors.priceYearly && (
                  <p className="text-sm text-destructive">{errors.priceYearly.message}</p>
                )}
              </div>
            </div>

          </section>

          <Separator />

          {/* ---------- Límites ---------- */}
          <section className="flex flex-col gap-5">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Límites</h3>
              <p className="text-xs text-muted-foreground">
                Marcar &quot;Sin límite&quot; deja el tope abierto. Es una decisión
                deliberada: un plan sin topes concede negocios y productos ilimitados.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <LimitField
                name="maxProducts"
                label="Máximo de productos"
                hint="Se cuenta sobre el catálogo del dueño."
                min={1}
                control={control}
                setValue={setValue}
                error={errors.maxProducts?.message}
              />
              <LimitField
                name="maxBusinesses"
                label="Máximo de negocios"
                hint="Negocios activos simultáneos."
                min={1}
                control={control}
                setValue={setValue}
                error={errors.maxBusinesses?.message}
              />
              <LimitField
                name="maxWorkers"
                label="Máximo de trabajadores"
                hint="Por negocio. 0 deja el plan sin equipo."
                min={0}
                control={control}
                setValue={setValue}
                error={errors.maxWorkers?.message}
              />
            </div>
          </section>

          <Separator />

          {/* ---------- Capacidades ---------- */}
          <section className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">Qué incluye</h3>
                <p className="text-xs text-muted-foreground">
                  Lo marcado se anuncia en la vitrina y habilita el acceso real.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllFeatures(!allGranted)}
              >
                {allGranted ? "Quitar todas" : "Marcar todas"}
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {PLAN_FEATURE_GROUPS.map((group) => {
                const groupFeatures = featuresByGroup(group);
                const allInGroup = groupFeatures.every(
                  (feature) => features?.[feature.key] === true,
                );

                return (
                  <div
                    key={group}
                    className="flex flex-col gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {group}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => setGroupFeatures(group, !allInGroup)}
                      >
                        {allInGroup ? "Quitar todas" : "Marcar todas"}
                      </Button>
                    </div>
                    {groupFeatures.map((feature) => (
                      <div key={feature.key} className="flex items-start gap-2.5">
                        <Checkbox
                          id={`feature-${feature.key}`}
                          className="mt-0.5"
                          checked={features?.[feature.key] === true}
                          onCheckedChange={(checked) => toggleFeature(feature.key, !!checked)}
                        />
                        <Label
                          htmlFor={`feature-${feature.key}`}
                          className="cursor-pointer text-sm font-normal leading-snug text-card-foreground"
                        >
                          {feature.label}
                        </Label>
                        <FeatureInfo feature={feature} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* ---------- Publicación ---------- */}
          <section className="flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-card-foreground">Publicación</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setValue("isActive", !!checked, { shouldValidate: true })
                  }
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="isActive" className="cursor-pointer text-sm font-medium text-card-foreground">
                    Plan activo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Si esta activo, se podra asignar a los usuarios.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <Checkbox
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked) =>
                    setValue("isPublic", !!checked, { shouldValidate: true })
                  }
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="isPublic" className="cursor-pointer text-sm font-medium text-card-foreground">
                    Visible en la vitrina
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Un plan a medida puede estar activo sin anunciarse.
                  </p>
                  {errors.isPublic && (
                    <p className="text-sm text-destructive">{errors.isPublic.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:max-w-xs">
              <Label htmlFor="displayOrder">Orden en la vitrina</Label>
              <Input
                id="displayOrder"
                type="number"
                min={0}
                step={1}
                {...register("displayOrder", { setValueAs: (v) => (v === "" ? 0 : Number(v)) })}
                aria-invalid={errors.displayOrder ? "true" : "false"}
              />
              {errors.displayOrder && (
                <p className="text-sm text-destructive">{errors.displayOrder.message}</p>
              )}
            </div>
          </section>

          {serverError && (
            <p className="text-sm text-destructive" role="alert">
              {serverError}
            </p>
          )}

          <Separator />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                isEditing ? "Guardando..." : "Creando plan..."
              ) : (
                <>
                  {isEditing ? (
                    <Save className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {isEditing ? "Guardar cambios" : "Crear plan"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
