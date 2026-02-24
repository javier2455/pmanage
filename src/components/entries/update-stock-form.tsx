"use client"

import { useState } from "react"
import { BusinessWithProducts } from "@/lib/types/business"
import { useBusiness } from "@/context/business-context"
import { useAllProductOfMyBusinesses } from "@/hooks/use-business"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Package,
  DollarSign,
  //   Check,
  X,
  RefreshCw,
  ArrowUp,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { EntriesUpdateStockFormData, entriesUpdateStockSchema } from "@/lib/validations/entries"
import { useAddStockToProductMutation } from "@/hooks/use-entries"
import { sileo } from "sileo"
import axios from "axios"

export function UpdateStockForm() {
  const { activeBusinessId } = useBusiness()
  const { data } = useAllProductOfMyBusinesses(activeBusinessId ?? "")
  const addStockToProductMutation = useAddStockToProductMutation()

  const [selectedProduct, setSelectedProduct] = useState<BusinessWithProducts | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<EntriesUpdateStockFormData>({
    resolver: zodResolver(entriesUpdateStockSchema),
    defaultValues: {
      quantity: 0,
      productId: "",
      description: "",
    },
  })

  const products: BusinessWithProducts[] = data?.data ?? []


  const quantityValue = watch("quantity")
  const newStockNum = Number(quantityValue) || 0

  async function onSubmit(data: EntriesUpdateStockFormData) {
    try {
      const response = await addStockToProductMutation.mutateAsync({
        businessId: activeBusinessId ?? "",
        productId: selectedProduct?.product.id ?? "",
        quantity: newStockNum,
        unitPrice: Number(selectedProduct?.price) ?? 0,
        description: data.description,
      })
      if (response) {
        sileo.success({
          title: "Stock actualizado correctamente", fill: '', styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          }, description: "El stock se ha actualizado correctamente"
        });
      }
      // reset()
      setSelectedProduct(null)
      // handleCancel()
    } catch (error) {
      console.log('error of onSubmit', error)
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: error.response.data.message });
        sileo.error({
          title: error.response?.data?.error, styles: { description: "text-[#dc2626]/90! text-[15px]!" }, description: error.response?.data?.message
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Product select */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-2">
          <Label className="text-card-foreground">Producto</Label>
          <Combobox<BusinessWithProducts | null>
            value={selectedProduct}
            onValueChange={(item) => {
              setSelectedProduct(item)
              setValue("productId", item?.id ?? "")
              setValue("quantity", 1)
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
                {products.map((item) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.product.name}
                  </ComboboxItem>
                ))}
                <ComboboxEmpty>No se encontró ningún producto.</ComboboxEmpty>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="my-6 space-y-6">
          {/* Product info - shown when product is selected */}
          {selectedProduct && (
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Current stock */}
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">Stock actual</Label>
                <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium tabular-nums text-card-foreground">
                    {selectedProduct.stock} unidades
                  </span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-auto text-xs",
                      selectedProduct.stock <= 10
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {selectedProduct.stock <= 10 ? "Stock bajo" : "Disponible"}
                  </Badge>
                </div>
              </div>

              {/* Current price */}
              <div className="flex flex-col gap-2">
                <Label className="text-card-foreground">
                  Precio unitario actual
                </Label>
                <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/50 px-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium tabular-nums text-card-foreground">
                    $
                    {Number(selectedProduct.price).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    USD
                  </span>
                </div>
              </div>
              {/* New stock input */}
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="new-stock" className="text-card-foreground">
                  Cantidad a ingresar
                </Label>
                <Input
                  id="new-stock"
                  type="number"
                  min="1"
                  placeholder="Ej: 50"
                  {...register("quantity", { valueAsNumber: true })}
                  disabled={!selectedProduct || selectedProduct.stock === 0}
                  aria-invalid={errors.quantity ? "true" : "false"}
                />
                {errors.quantity && (
                  <p className="text-xs text-destructive">
                    {errors.quantity.message}
                  </p>
                )}
                {newStockNum > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ArrowUp className="h-3 w-3 text-primary" />
                    <span>
                      El nuevo stock total sera de{" "}
                      <span className="font-semibold text-card-foreground">
                        {selectedProduct.stock + newStockNum}
                      </span>{" "}
                      unidades
                    </span>
                  </p>
                )}
              </div>

              {/* Description input */}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className="text-card-foreground">
              Descripción
            </Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
        <Separator />

        {/* Buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="bg-transparent"
            onClick={() => {
              setSelectedProduct(null)
              reset()
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={!selectedProduct}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar stock
          </Button>
        </div>
      </form>
    </div>
  )
}
