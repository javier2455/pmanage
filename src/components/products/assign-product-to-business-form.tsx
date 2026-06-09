"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { sileo } from "sileo"
import { X, Link2, BellRing } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBusiness } from "@/context/business-context"
import { useCreateProductInBusinessMutation } from "@/hooks/use-product"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ProBadge } from "@/components/ui/pro-badge"
import { Separator } from "@/components/ui/separator"
import { ProductCombobox } from "@/components/products/product-combobox"
import { AssignProductToBusinessFormData, assignProductToBusinessSchema } from "@/lib/validations/products"
import { Product } from "@/lib/types/product"

export function AssignProductToBusinessForm() {
  const router = useRouter()
  const pathname = usePathname()
  const { activeBusinessId } = useBusiness()
  const { isProPlan } = useUserRoleAndPlan()
  const createProductInBusinessMutation = useCreateProductInBusinessMutation()
  // Producto elegido en el combobox; lo guardamos completo porque la lista ya
  // no vive en memoria (se pagina/busca en servidor) y onSubmit lo necesita.
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<AssignProductToBusinessFormData>({
    resolver: zodResolver(assignProductToBusinessSchema),
    defaultValues: {
      productId: "",
      entryPrice: 0,
      price: 0,
      stock: 0,
      stockAlertThreshold: null,
    },
  })

  const selectedProductId = watch("productId")

  async function onSubmit(data: AssignProductToBusinessFormData) {
    if (!activeBusinessId) {
      sileo.error({
        title: "Negocio no seleccionado",
        description: "Selecciona un negocio para continuar",
      })
      return
    }

    const product =
      selectedProduct?.id === data.productId ? selectedProduct : null
    if (!product) {
      setError("productId", { message: "Producto no encontrado" })
      return
    }

    try {
      await createProductInBusinessMutation.mutateAsync({
        businessId: activeBusinessId,
        productId: product.id,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId ?? null,
        unit: product.unit,
        imageUrl: product.imageUrl ?? undefined,
        price: data.price,
        entryPrice: data.entryPrice,
        stock: data.stock,
        // Solo aplica para usuarios Pro; el campo está oculto para el resto.
        stockAlertThreshold: isProPlan ? (data.stockAlertThreshold ?? null) : null,
      })

      sileo.success({
        title: "Producto asignado correctamente",
        fill: "",
        styles: {
          title: "text-white! text-[16px]! font-bold!",
          description: "text-white/90! text-[15px]!",
        },
        description: "El producto se ha asignado a tu negocio correctamente",
      })
      reset()
      setSelectedProduct(null)
      router.push("/dashboard/business/products")
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: error.response.data.message })
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: error.response.data.message,
        })
      }
    }
  }

  if (!activeBusinessId) {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
        <p className="text-sm font-medium">Selecciona un negocio</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Debes seleccionar un negocio activo para asignar productos.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit(onSubmit, () => {
          sileo.error({
            title: "Revisa el formulario",
            description: "Completa todos los campos requeridos correctamente",
          })
        })}
      >
        {/* Product select */}
        <div className="flex flex-col gap-2 mb-6">
          <Label htmlFor="product-select" className="text-card-foreground">
            Producto <span className="text-destructive">*</span>
          </Label>
          <ProductCombobox
            id="product-select"
            value={selectedProductId}
            invalid={!!errors.productId}
            onChange={(product) => {
              setSelectedProduct(product)
              setValue("productId", product?.id ?? "", { shouldValidate: true })
            }}
          />
          {errors.productId && (
            <p className="text-xs text-destructive">{errors.productId.message}</p>
          )}
        </div>

        {/* Entry Price, Price, Stock */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="entry-price" className="text-card-foreground">
              Precio de entrada <span className="text-destructive">*</span>
            </Label>
            <Input
              id="entry-price"
              type="number"
              min={1}
              step="0.01"
              placeholder="0.00"
              {...register("entryPrice", { valueAsNumber: true })}
              aria-invalid={errors.entryPrice ? "true" : "false"}
            />
            {errors.entryPrice && (
              <p className="text-xs text-destructive">{errors.entryPrice.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price" className="text-card-foreground">
              Precio <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min={1}
              step="0.01"
              placeholder="0.00"
              {...register("price", { valueAsNumber: true })}
              aria-invalid={errors.price ? "true" : "false"}
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stock" className="text-card-foreground">
              Stock <span className="text-destructive">*</span>
            </Label>
            <Input
              id="stock"
              type="number"
              min={1}
              step={1}
              placeholder="0"
              {...register("stock", { valueAsNumber: true })}
              aria-invalid={errors.stock ? "true" : "false"}
            />
            {errors.stock && (
              <p className="text-xs text-destructive">{errors.stock.message}</p>
            )}
          </div>
        </div>

        {/* Stock alert threshold — feature Pro, opcional */}
        {isProPlan && (
          <div className="mb-6 flex flex-col gap-2">
            <Label
              htmlFor="stock-alert-threshold"
              className="flex items-center gap-2 text-card-foreground"
            >
              <BellRing className="h-3.5 w-3.5 text-primary" />
              Umbral de alerta de stock{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (opcional)
              </span>
              <ProBadge className="ml-0" />
            </Label>
            <Input
              id="stock-alert-threshold"
              type="number"
              min={1}
              step={1}
              placeholder="Ej: 5"
              {...register("stockAlertThreshold", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined ? null : Number(v),
              })}
              aria-invalid={errors.stockAlertThreshold ? "true" : "false"}
            />
            {errors.stockAlertThreshold ? (
              <p className="text-xs text-destructive">
                {errors.stockAlertThreshold.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Te avisaremos cuando el stock baje de este valor. Puedes
                ajustarlo o desactivarlo luego desde el inventario. Si lo dejas
                vacío, el inventario marcará «Stock bajo» por defecto al quedar 5
                unidades o menos (solo aviso visual; para recibir notificaciones
                debes configurar un umbral).
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* Buttons */}
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="default" asChild>
            <Link href={pathname === "/dashboard/business/inventory/create" ? "/dashboard/business/inventory" : "/dashboard/business/products"}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={createProductInBusinessMutation.isPending}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {createProductInBusinessMutation.isPending ? "Agregando..." : "Agregar al negocio"}
          </Button>
        </div>
      </form>
    </div>
  )
}
