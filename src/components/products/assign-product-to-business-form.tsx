"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { sileo } from "sileo"
import { X, Link2, BellRing } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useBusiness } from "@/context/business-context"
import { useCreateProductInBusinessMutation } from "@/hooks/use-product"
import { useGetAllProductCategoriesQuery } from "@/hooks/use-product-categories"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ProBadge } from "@/components/ui/pro-badge"
import { Separator } from "@/components/ui/separator"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { ProductCombobox } from "@/components/products/product-combobox"
import { AmountCurrencyField } from "@/components/products/amount-currency-field"
import { useExchangeRate } from "@/hooks/use-exchange"
import {
  BASE_CURRENCY,
  convertToBase,
  currencyLabel,
  formatMoney,
  getAvailableCurrencies,
  getCurrencyRate,
  roundMoney,
} from "@/lib/currency"
import { mapCurrencyError } from "@/lib/currency-errors"
import {
  AssignProductToBusinessFormData,
  assignProductToBusinessSchema,
  MAX_PRODUCT_PRICE,
} from "@/lib/validations/products"
import { Product } from "@/lib/types/product"

type CategoryOption = { id: string; name: string }

export function AssignProductToBusinessForm() {
  const router = useRouter()
  const pathname = usePathname()
  const { activeBusinessId } = useBusiness()
  const { hasFeature } = useUserRoleAndPlan()
  const canUseStockAlerts = hasFeature("stockAlerts")
  const createProductInBusinessMutation = useCreateProductInBusinessMutation()
  // Tasas de cambio del negocio para el costo multimoneda (ver multimoneda-productos.md).
  const { data: exchangeRateData } = useExchangeRate(activeBusinessId ?? "")
  const exchange = exchangeRateData?.data
  const availableCurrencies = getAvailableCurrencies(exchange)
  // Producto elegido en el combobox; lo guardamos completo porque la lista ya
  // no vive en memoria (se pagina/busca en servidor) y onSubmit lo necesita.
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // La categoría ahora vive en el BusinessProduct: se elige aquí, al asignar el
  // producto al negocio. Ver docs/category.md.
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetAllProductCategoriesQuery({
      page: 1,
      limit: 1000,
      businessId: activeBusinessId ?? undefined,
      enabled: !!activeBusinessId,
    })
  const productCategories = categoriesData?.data ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm<AssignProductToBusinessFormData>({
    resolver: zodResolver(assignProductToBusinessSchema),
    defaultValues: {
      productId: "",
      categoryId: null,
      entryPrice: 0,
      price: 0,
      stock: 0,
      stockAlertThreshold: null,
      currency: BASE_CURRENCY,
      priceInputCurrency: BASE_CURRENCY,
      registerAsExpense: false,
    },
  })

  const selectedProductId = watch("productId")
  const entryPriceValue = watch("entryPrice")
  const priceValue = watch("price")

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

    // Multimoneda: si el costo se ingresó en otra moneda, enviamos la moneda y la
    // misma tasa con la que se previsualizó el costo en CUP (ver multimoneda-productos.md).
    const selectedCurrency = data.currency ?? BASE_CURRENCY
    const rate = getCurrencyRate(exchange, selectedCurrency)

    // El precio de venta se envía en la moneda en que se cotiza; el backend lo
    // convierte a CUP con `priceExchangeRateApplied`, igual que hace con el
    // costo. Ver docs/moneda-precio-venta.md.
    const priceCurrency = data.priceInputCurrency ?? BASE_CURRENCY
    const priceRate = getCurrencyRate(exchange, priceCurrency)
    // El backend rechazaría la moneda sin tasa, pero avisamos antes de enviar
    // para no gastar un viaje y poder señalar el campo.
    if (priceRate == null) {
      setError("price", {
        message: `La moneda ${currencyLabel(priceCurrency)} no tiene tasa configurada. Configúrala en Tasas de cambio o fija el precio en ${currencyLabel(BASE_CURRENCY)}.`,
      })
      return
    }
    // El tope del schema se aplica a lo escrito; lo que se guarda es el
    // equivalente en CUP, así que se valida ese (200 USD son 135,000 CUP).
    const priceInBase = roundMoney(convertToBase(data.price, priceCurrency, exchange))
    if (priceInBase > MAX_PRODUCT_PRICE) {
      setError("price", {
        message: `El precio equivale a ${formatMoney(priceInBase, BASE_CURRENCY)} y el máximo es ${formatMoney(MAX_PRODUCT_PRICE, BASE_CURRENCY)}.`,
      })
      return
    }

    try {
      await createProductInBusinessMutation.mutateAsync({
        businessId: activeBusinessId,
        productId: product.id,
        name: product.name,
        description: product.description,
        // La categoría se asigna al BusinessProduct desde el selector del form.
        categoryId: data.categoryId ?? null,
        unit: product.unit,
        imageUrl: product.imageUrl ?? undefined,
        // En la moneda cotizada; el backend lo convierte y guarda en CUP.
        price: data.price,
        priceCurrency,
        priceExchangeRateApplied:
          priceCurrency !== BASE_CURRENCY ? priceRate : undefined,
        entryPrice: data.entryPrice,
        stock: data.stock,
        // Solo aplica para usuarios Pro; el campo está oculto para el resto.
        stockAlertThreshold: canUseStockAlerts ? (data.stockAlertThreshold ?? null) : null,
        currency: selectedCurrency,
        exchangeRateApplied:
          selectedCurrency !== BASE_CURRENCY ? (rate ?? undefined) : undefined,
        registerAsExpense: data.registerAsExpense,
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

      // Confirmación adicional del gasto auto-registrado (en la moneda original).
      if (data.registerAsExpense) {
        const expenseAmount = (data.entryPrice * data.stock).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
        sileo.success({
          title: "Gasto registrado",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: `${expenseAmount} ${selectedCurrency} en Reposición de stock`,
        })
      }
      reset()
      setSelectedProduct(null)
      router.push("/dashboard/business/products")
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = mapCurrencyError(
          error,
          "No se pudo asignar el producto. Intenta de nuevo.",
        )
        setError("root", { message })
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: message,
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

        {/* Category — se asigna al BusinessProduct */}
        <div className="flex flex-col gap-2 mb-6">
          <Label htmlFor="category-select" className="text-card-foreground">
            Categoría
          </Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => {
              const items: CategoryOption[] = productCategories.map((c) => ({
                id: c.id,
                name: c.name,
              }))
              const selectedOption: CategoryOption | null =
                items.find((i) => i.id === field.value) ?? null
              return (
                <Combobox<CategoryOption | null>
                  value={selectedOption}
                  onValueChange={(opt) => field.onChange(opt?.id ?? null)}
                  items={items}
                  itemToStringLabel={(opt) => opt?.name ?? ""}
                  isItemEqualToValue={(a, b) =>
                    (a?.id ?? null) === (b?.id ?? null)
                  }
                >
                  <ComboboxInput
                    id="category-select"
                    placeholder={
                      isLoadingCategories
                        ? "Cargando categorías..."
                        : items.length === 0
                          ? "Aún no hay categorías"
                          : "Buscar categoría..."
                    }
                    className="w-full"
                    showClear={!!selectedOption}
                    disabled={isLoadingCategories || items.length === 0}
                  />
                  <ComboboxContent>
                    <ComboboxList className="max-h-64">
                      {items.map((opt) => (
                        <ComboboxItem key={opt.id} value={opt}>
                          {opt.name}
                        </ComboboxItem>
                      ))}
                      <ComboboxEmpty>
                        No se encontró ninguna categoría.
                      </ComboboxEmpty>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              )
            }}
          />
          <p className="text-xs text-muted-foreground">
            Opcional — administra tus categorías en la sección de{" "}
            <Link
              href="/dashboard/business/categories/products"
              className="underline-offset-2 hover:text-white hover:underline"
            >
              Categorías
            </Link>
            .
          </p>
          {errors.categoryId && (
            <p className="text-xs text-destructive">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Costo de entrada + moneda */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
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
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <AmountCurrencyField
                currency={field.value ?? BASE_CURRENCY}
                onCurrencyChange={field.onChange}
                availableCurrencies={availableCurrencies}
                amount={Number(entryPriceValue) || 0}
                exchangeRate={exchange}
              />
            )}
          />
        </div>

        {/* Registrar la entrada como gasto de reposición de stock */}
        <div className="mb-6 flex items-start gap-2" data-tour="product-assign-as-expense">
          <Controller
            control={control}
            name="registerAsExpense"
            render={({ field }) => (
              <Checkbox
                id="register-as-expense"
                checked={!!field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5"
              />
            )}
          />
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="register-as-expense"
              className="cursor-pointer text-card-foreground"
            >
              Registrar como gasto de reposición de stock
            </Label>
            <p className="text-xs text-muted-foreground">
              Crea automáticamente un gasto en la categoría «Reposición de stock»
              por el costo de entrada × stock.
            </p>
          </div>
        </div>

        {/* Precio de venta + moneda en la que se cobra */}
        <div className="grid gap-4 sm:grid-cols-2 mb-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="price" className="text-card-foreground">
              Precio de venta <span className="text-destructive">*</span>
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
          <Controller
            control={control}
            name="priceInputCurrency"
            render={({ field }) => (
              <AmountCurrencyField
                id="price-currency"
                label="Moneda del precio"
                currency={field.value ?? BASE_CURRENCY}
                onCurrencyChange={field.onChange}
                availableCurrencies={availableCurrencies}
                amount={Number(priceValue) || 0}
                exchangeRate={exchange}
              />
            )}
          />
        </div>
        <p className="mb-6 text-xs text-muted-foreground">
          Si cobras este producto en otra moneda, elígela aquí: se guarda su
          equivalente en {currencyLabel(BASE_CURRENCY)} con la tasa de hoy, que es
          el que usan las ventas, el margen y el costo medio. Al cambiar la tasa
          tendrás que revisar el precio.
        </p>

        {/* Stock */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
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

        {/* Umbral de alerta de stock — capacidad `stockAlerts`, opcional */}
        {canUseStockAlerts && (
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
          <Button type="button" variant="outline" asChild>
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
