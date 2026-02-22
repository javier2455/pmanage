"use client"

import { useState, useMemo } from "react"
import { useBusiness } from "@/context/business-context"
import { useAllProductOfMyBusinesses } from "@/hooks/use-business"
import { useCreateSaleMutation } from "@/hooks/use-sales"
import { BusinessWithProducts } from "@/lib/types/business"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { ShoppingCart, Package, Check, X, DollarSign } from "lucide-react"
import { CreateSaleFormData, createSaleSchema } from "@/lib/validations/business"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { sileo } from "sileo"

// const EXCHANGE_RATES = { usd: 1, eur: 0.92, mn: 17.25 }

export default function CreateSalesPage() {
  const { activeBusinessId } = useBusiness()
  const { data } = useAllProductOfMyBusinesses(activeBusinessId ?? "")
  const createSaleMutation = useCreateSaleMutation()

  const [selectedProduct, setSelectedProduct] = useState<BusinessWithProducts | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<CreateSaleFormData>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      stock: 0,
      productId: "",
    },
  })

  const stockValue = watch("stock")
  const quantityNum = Number(stockValue) || 0

  const products: BusinessWithProducts[] = data?.data ?? []

  const stockStatus = useMemo(() => {
    if (!selectedProduct) return null
    if (selectedProduct.stock === 0) return { label: "Sin stock", variant: "destructive" as const }
    if (selectedProduct.stock <= 10) return { label: "Stock bajo", variant: "secondary" as const }
    return { label: "Disponible", variant: "secondary" as const }
  }, [selectedProduct])

  const unitPrice = selectedProduct?.price ?? 0
  const totalUsd = Number(unitPrice) * quantityNum
  const isValid = selectedProduct && quantityNum > 0 && quantityNum <= selectedProduct.stock

  function handleCancel() {
    setSelectedProduct(null)
    reset({ stock: 0, productId: "" })
  }

  async function onSubmit(data: CreateSaleFormData) {
    try {
      if (!isValid) return
      console.log('data of onSubmit', data)
      console.log('activeBusinessId of onSubmit', activeBusinessId)
      const response = await createSaleMutation.mutateAsync({
        idbusiness: activeBusinessId ?? "",
        idproducto: data.productId,
        cantidad: data.stock,
        precio: Number(unitPrice),
        descripcion: "",
      })
      console.log('response of create sale', response)
      if (response) {
        sileo.success({
          title: "Venta registrada correctamente", fill: '', styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          }, description: "La venta se ha registrado correctamente"
        });
        handleCancel()
      }
    } catch (error) {
      console.log('error of onSubmit', error)
      if (axios.isAxiosError(error) && error.response?.data?.error === "Not Found") {
        setError("root", { message: "Producto no encontrado o negocio no encontrado" });
      } else if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: error.response.data.message });
      } else {
        setError("root", { message: "Error al registrar la venta. Intenta de nuevo." });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ventas
        </h1>
        <p className="text-muted-foreground">
          Registra una nueva venta seleccionando el producto y la cantidad
        </p>
      </div>

      {/* {saved && ( ... mensaje de éxito ... )} */}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form - left side */}
        <Card className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-card-foreground">
                    Nueva venta
                  </CardTitle>
                  <CardDescription>
                    Completa los datos del producto a vender
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* Selector de productos - carga desde data.data (BusinessWithProducts) */}
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">Producto</Label>
                <Combobox<BusinessWithProducts | null>
                  value={selectedProduct}
                  onValueChange={(item) => {
                    setSelectedProduct(item)
                    setValue("stock", 0)
                  }}
                  items={products}
                  itemToStringLabel={(bp) => (bp ? bp.product.name : "")}
                  isItemEqualToValue={(a, b) => a?.id === b?.id}
                >
                  <ComboboxInput
                    placeholder="Buscar producto..."
                    className="w-full"
                    showClear={!!selectedProduct}

                  />
                  <ComboboxContent>
                    <ComboboxList className="max-h-64">
                      {products.map((bp) => (
                        <ComboboxItem key={bp.id} value={bp} onClick={() => setValue("productId", bp.product.id)}>
                          <div className="flex flex-1 items-start p-1">
                            <span>{bp.product.name}</span>
                            {/* <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                              stock de: {bp.stock}
                            </span> */}
                          </div>
                        </ComboboxItem>
                      ))}
                      <ComboboxEmpty>No se encontró ningún producto.</ComboboxEmpty>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors.productId && (
                  <p className="text-xs text-destructive">{errors.productId.message}</p>
                )}
              </div>

              {/* Stock disponible */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-card-foreground">
                    Stock disponible
                  </Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm tabular-nums text-card-foreground">
                      {selectedProduct ? selectedProduct.stock : "--"}
                    </span>
                    {stockStatus && (
                      <Badge
                        variant={stockStatus.variant}
                        className={cn(
                          "ml-auto text-xs",
                          stockStatus.label === "Sin stock"
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : stockStatus.label === "Stock bajo"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        )}
                      >
                        {stockStatus.label}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="stock" className="text-card-foreground">
                    Cantidad a vender
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min={1}
                    max={selectedProduct?.stock ?? 0}
                    {...register("stock", { valueAsNumber: true })}
                    disabled={!selectedProduct || selectedProduct.stock === 0}
                    placeholder="0"
                  />
                  {selectedProduct && quantityNum > selectedProduct.stock && (
                    <p className="text-xs text-destructive">
                      La cantidad excede el stock disponible ({selectedProduct.stock})
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-card-foreground">
                    Precio unitario
                  </Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm tabular-nums text-card-foreground">
                      {selectedProduct
                        ? `${unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                        : "--"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-card-foreground">Total a pagar</Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold tabular-nums text-card-foreground">
                      {quantityNum > 0
                        ? `${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                        : "--"}
                    </span>
                  </div>
                </div>
              </div>


              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="bg-transparent"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={!isValid}>
                  <Check className="mr-2 h-4 w-4" />
                  Registrar venta
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Summary - right side - comentado */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Resumen de venta
            </CardTitle>
            <CardDescription>
              Detalle y conversiones de moneda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-start justify-between border-b border-border py-4 first:pt-0">
                <span className="text-sm text-muted-foreground">Producto</span>
                <span className="text-sm font-medium text-card-foreground text-right max-w-[55%]">
                  {selectedProduct?.product.name ?? "--"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm text-muted-foreground">Cantidad</span>
                <span className="text-sm font-medium text-card-foreground tabular-nums">
                  {quantityNum > 0 ? quantityNum : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm text-muted-foreground">
                  Precio unitario
                </span>
                <span className="text-sm font-medium text-card-foreground tabular-nums">
                  {selectedProduct
                    ? `$${unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                    : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border py-4">
                <span className="text-sm text-muted-foreground">
                  Total (USD)
                </span>
                <span className="text-sm font-semibold text-card-foreground tabular-nums">
                  {quantityNum > 0
                    ? `$${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`
                    : "--"}
                </span>
              </div>
              {/* Cantidad, Precio unitario, Total USD, Conversiones EUR/MN, Tasa de cambio - comentados */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

