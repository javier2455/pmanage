"use client"

import { Controller, useFieldArray, type Control } from "react-hook-form"
import type { FieldErrors } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MoneyAmountInput } from "@/components/ui/currency/money-amount-input"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { useGetAllProductsQuery } from "@/hooks/use-product"
import type { Product } from "@/lib/types/product"
import type { ProviderFormData } from "@/lib/validations/providers"

interface ProviderProductsFieldProps {
  control: Control<ProviderFormData>
  errors: FieldErrors<ProviderFormData>
}

export function ProviderProductsField({
  control,
  errors,
}: ProviderProductsFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "providerProducts",
  })

  const { data: productsData, isLoading: isLoadingProducts } =
    useGetAllProductsQuery({ page: 1, limit: 1000 })
  const products: Product[] = productsData?.data ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-card-foreground">Productos suministrados</Label>
          <p className="text-xs text-muted-foreground">
            Opcional. Asocia los productos que este proveedor suministra y su precio de compra.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ productId: "", price: undefined })}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar producto
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Aún no has agregado productos. Pulsa “Agregar producto” para empezar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const productError = errors.providerProducts?.[index]?.productId
            const priceError = errors.providerProducts?.[index]?.price

            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-md border border-border bg-card p-3 sm:grid-cols-[1fr_160px_auto]"
              >
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`provider-product-${index}`}
                    className="text-xs text-muted-foreground"
                  >
                    Producto
                  </Label>
                  <Controller
                    control={control}
                    name={`providerProducts.${index}.productId`}
                    render={({ field: ctl }) => {
                      const selected = products.find((p) => p.id === ctl.value) ?? null
                      return (
                        <Combobox<Product | null>
                          value={selected}
                          onValueChange={(opt) => ctl.onChange(opt?.id ?? "")}
                          items={products}
                          itemToStringLabel={(opt) => opt?.name ?? ""}
                          isItemEqualToValue={(a, b) =>
                            (a?.id ?? null) === (b?.id ?? null)
                          }
                        >
                          <ComboboxInput
                            placeholder={
                              isLoadingProducts
                                ? "Cargando productos..."
                                : products.length === 0
                                  ? "Aún no hay productos"
                                  : "Buscar producto..."
                            }
                            className="w-full"
                            showClear={!!selected}
                            disabled={isLoadingProducts || products.length === 0}
                          />
                          <ComboboxContent>
                            <ComboboxList className="max-h-64">
                              {products.map((p) => (
                                <ComboboxItem key={p.id} value={p}>
                                  {p.name}
                                </ComboboxItem>
                              ))}
                              <ComboboxEmpty>
                                No se encontró ningún producto.
                              </ComboboxEmpty>
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      )
                    }}
                  />
                  {productError && (
                    <p className="text-xs text-destructive">
                      {productError.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`provider-product-price-${index}`}
                    className="text-xs text-muted-foreground"
                  >
                    Precio de compra
                  </Label>
                  <Controller
                    control={control}
                    name={`providerProducts.${index}.price`}
                    render={({ field: ctl }) => (
                      <MoneyAmountInput
                        id={`provider-product-price-${index}`}
                        min={0}
                        initialCUP={
                          typeof ctl.value === "number" ? ctl.value : undefined
                        }
                        onChangeCUP={(cup) => ctl.onChange(cup)}
                        hasError={!!priceError}
                      />
                    )}
                  />
                  {priceError && (
                    <p className="text-xs text-destructive">
                      {priceError.message}
                    </p>
                  )}
                </div>

                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    aria-label="Quitar producto"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
