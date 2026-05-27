"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { sileo } from "sileo"
import { Save, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  providerFormSchema,
  type ProviderFormData,
} from "@/lib/validations/providers"
import { isDialCodeOnly } from "@/lib/validations/phone"
import {
  useCreateProviderMutation,
  useUpdateProviderMutation,
} from "@/hooks/use-provider"
import type {
  ProviderProductInput,
  ProviderWithRelations,
} from "@/lib/types/provider"
import { useBusiness } from "@/context/business-context"
import { ProviderProductsField } from "./provider-products-field"

type Mode = "create" | "edit"

interface ProviderFormProps {
  mode: Mode
  provider?: ProviderWithRelations
}

function toFormDefaults(
  provider?: ProviderWithRelations,
): ProviderFormData {
  return {
    name: provider?.name ?? "",
    description: provider?.description ?? "",
    contactName: provider?.contactName ?? "",
    email: provider?.email ?? "",
    phone: provider?.phone ?? "",
    providerProducts:
      provider?.providerProducts?.map((pp) => ({
        productId: pp.product.id,
        price: Number(pp.price),
      })) ?? [],
  }
}

function normalizeString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function ProviderForm({ mode, provider }: ProviderFormProps) {
  const router = useRouter()
  const { activeBusinessId } = useBusiness()
  const createMutation = useCreateProviderMutation()
  const updateMutation = useUpdateProviderMutation()

  const initialProducts = provider?.providerProducts ?? []
  const isPending = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: toFormDefaults(provider),
  })

  async function onSubmit(data: ProviderFormData) {
    const businessId = provider?.businessId ?? activeBusinessId
    if (!businessId) {
      sileo.error({
        title: "Sin negocio activo",
        description:
          "Selecciona un negocio activo antes de crear o editar un proveedor.",
      })
      return
    }

    const providerProductsField: ProviderProductInput[] | undefined =
      data.providerProducts?.map((pp) => ({
        productId: pp.productId,
        price: pp.price,
      }))

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name: data.name.trim(),
          description: normalizeString(data.description),
          contactName: normalizeString(data.contactName),
          email: normalizeString(data.email ?? null),
          phone: data.phone && !isDialCodeOnly(data.phone) ? normalizeString(data.phone) : null,
          businessId,
          providerProducts: providerProductsField,
        })

        sileo.success({
          title: "Proveedor creado correctamente",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: "El proveedor se ha registrado correctamente",
        })
        router.push("/dashboard/business/providers")
        return
      }

      if (!provider) return

      // Estrategia para providerProducts en update:
      // - El backend hace REPLACE COMPLETO si se envía el campo.
      // - Si el usuario no tocó el array y no hay diferencias, no lo enviamos
      //   para preservar las relaciones existentes.
      const productsChanged =
        Boolean(dirtyFields.providerProducts) ||
        initialProducts.length !== (providerProductsField?.length ?? 0)

      await updateMutation.mutateAsync({
        providerId: provider.id,
        payload: {
          name: data.name.trim(),
          description: normalizeString(data.description),
          contactName: normalizeString(data.contactName),
          email: normalizeString(data.email ?? null),
          phone: data.phone && !isDialCodeOnly(data.phone) ? normalizeString(data.phone) : null,
          providerProducts: productsChanged
            ? providerProductsField
            : undefined,
        },
      })

      sileo.success({
        title: "Proveedor actualizado",
        fill: "",
        styles: {
          title: "text-white! text-[16px]! font-bold!",
          description: "text-white/90! text-[15px]!",
        },
        description: "Los cambios se guardaron correctamente",
      })
      router.push("/dashboard/business/providers")
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: String(error.response.data.message) })
        sileo.error({
          title: error.response.data.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: Array.isArray(error.response.data.message)
            ? error.response.data.message.join(", ")
            : error.response.data.message,
        })
      }
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit, () => {
        sileo.error({
          title: "Revisa el formulario",
          description: "Completa los campos requeridos correctamente",
        })
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="provider-name" className="text-card-foreground">
            Nombre del proveedor <span className="text-destructive">*</span>
          </Label>
          <Input
            id="provider-name"
            placeholder="Ej: Distribuidora ABC"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="provider-description" className="text-card-foreground">
            Descripción
          </Label>
          <Textarea
            id="provider-description"
            rows={3}
            className="resize-none"
            placeholder="Breve descripción o notas internas..."
            {...register("description")}
            aria-invalid={errors.description ? "true" : "false"}
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="provider-contact" className="text-card-foreground">
            Persona de contacto
          </Label>
          <Input
            id="provider-contact"
            placeholder="Ej: María Pérez"
            {...register("contactName")}
            aria-invalid={errors.contactName ? "true" : "false"}
          />
          {errors.contactName && (
            <p className="text-xs text-destructive">
              {errors.contactName.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="provider-phone" className="text-card-foreground">
            Teléfono
          </Label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value ?? ""}
                onChange={field.onChange}
                defaultCountry="cu"
                aria-invalid={errors.phone ? "true" : "false"}
              />
            )}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="provider-email" className="text-card-foreground">
            Email
          </Label>
          <Input
            id="provider-email"
            type="email"
            placeholder="contacto@proveedor.com"
            {...register("email")}
            aria-invalid={errors.email ? "true" : "false"}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <Separator />

      <ProviderProductsField
        control={control}
        register={register}
        errors={errors}
      />

      <Separator />

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="default" asChild>
          <Link href="/dashboard/business/providers">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? (
            <UserPlus className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isPending
            ? mode === "create"
              ? "Registrando..."
              : "Guardando..."
            : mode === "create"
              ? "Registrar proveedor"
              : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
