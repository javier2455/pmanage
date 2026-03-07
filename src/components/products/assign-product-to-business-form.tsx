"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { sileo } from "sileo"
import { X, Link2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBusiness } from "@/context/business-context"
import { useCreateProductInBusinessMutation } from "@/hooks/use-product"
import { useGetAllProductsQuery } from "@/hooks/use-product"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AssignProductToBusinessFormData, assignProductToBusinessSchema } from "@/lib/validations/products"
import { Product } from "@/lib/types/product"

export function AssignProductToBusinessForm() {
  const router = useRouter()
  const pathname = usePathname()
  const { activeBusinessId } = useBusiness()
  const createProductInBusinessMutation = useCreateProductInBusinessMutation()
  const { data: productsData, isLoading: isLoadingProducts } = useGetAllProductsQuery()

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

    const product = productsData?.data?.find((p: Product) => p.id === data.productId)
    if (!product) {
      setError("productId", { message: "Producto no encontrado" })
      return
    }

    try {
      await createProductInBusinessMutation.mutateAsync({
        businessId: activeBusinessId,
        name: product.name,
        description: product.description,
        category: product.category,
        unit: product.unit,
        imageUrl: product.imageUrl ?? undefined,
        price: data.price,
        entryPrice: data.entryPrice,
        stock: data.stock,
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
          <Select
            value={selectedProductId || undefined}
            onValueChange={(value) => setValue("productId", value ?? "", { shouldValidate: true })}
            disabled={isLoadingProducts}
          >
            <SelectTrigger
              id="product-select"
              className="w-full"
              aria-invalid={errors.productId ? "true" : "false"}
            >
              <SelectValue
                placeholder={
                  isLoadingProducts ? "Cargando productos..." : "Selecciona un producto..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {productsData?.data?.map((product: Product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productId && (
            <p className="text-xs text-destructive">{errors.productId.message}</p>
          )}
          {!isLoadingProducts && productsData?.data?.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No hay productos disponibles. Crea uno primero en la pestaña &quot;Crear nuevo producto&quot;.
            </p>
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

        <Separator />

        {/* Buttons */}
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href={pathname === "/dashboard/business/inventory/create" ? "/dashboard/business/inventory" : "/dashboard/business/products"}
            className="bg-transparent border border-white rounded-lg px-3 py-1 text-white flex items-center text-[14px]"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
          <Button
            type="submit"
            disabled={createProductInBusinessMutation.isPending}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Agregar al negocio
          </Button>
        </div>
      </form>
    </div>
  )
}
