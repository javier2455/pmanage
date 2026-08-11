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
import { ProBadge } from "@/components/ui/pro-badge"
import { Separator } from "@/components/ui/separator"
import {
  CategoryCombobox,
  type CategoryOption,
} from "@/components/categories/category-combobox"
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
  MIN_MONEY_IN_BASE,
} from "@/lib/validations/products"
import { Product } from "@/lib/types/product"

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
      categoryName: null,
      entryPrice: 0,
      price: 0,
      stock: 0,
      stockAlertThreshold: null,
      currency: BASE_CURRENCY,
      priceInputCurrency: BASE_CURRENCY,
    },
  })

  const selectedProductId = watch("productId")
  const entryPriceValue = watch("entryPrice")
  const priceValue = watch("price")
  const categoryIdValue = watch("categoryId") ?? null
  // Categoría escrita a mano que aún no existe; el backend la crea al guardar.
  const categoryNameValue = watch("categoryName") ?? null

  const categoryItems: CategoryOption[] = productCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }))

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
    // Los límites del schema se aplican a lo escrito; lo que se guarda es el
    // equivalente en CUP, así que se validan sobre ese (200 USD son 135,000 CUP
    // por arriba; 0,60 USD son 264 CUP por abajo, y son válidos).
    const priceInBase = roundMoney(convertToBase(data.price, priceCurrency, exchange))
    if (priceInBase > MAX_PRODUCT_PRICE) {
      setError("price", {
        message: `El precio equivale a ${formatMoney(priceInBase, BASE_CURRENCY)} y el máximo es ${formatMoney(MAX_PRODUCT_PRICE, BASE_CURRENCY)}.`,
      })
      return
    }
    if (priceInBase < MIN_MONEY_IN_BASE) {
      setError("price", {
        message: `El precio equivale a ${formatMoney(priceInBase, BASE_CURRENCY)} y el mínimo que se puede guardar es ${formatMoney(MIN_MONEY_IN_BASE, BASE_CURRENCY)}.`,
      })
      return
    }

    // Ídem para el costo, que también puede teclearse en divisa.
    const entryPriceInBase = roundMoney(
      convertToBase(data.entryPrice, selectedCurrency, exchange),
    )
    if (entryPriceInBase < MIN_MONEY_IN_BASE) {
      setError("entryPrice", {
        message: `El costo equivale a ${formatMoney(entryPriceInBase, BASE_CURRENCY)} y el mínimo que se puede guardar es ${formatMoney(MIN_MONEY_IN_BASE, BASE_CURRENCY)}.`,
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
        // Si escribió una que no existe, el backend la registra al guardar.
        categoryName: data.categoryName ?? null,
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
          <CategoryCombobox
            id="category-select"
            categories={categoryItems}
            categoryId={categoryIdValue}
            categoryName={categoryNameValue}
            isLoading={isLoadingCategories}
            invalid={!!errors.categoryId || !!errors.categoryName}
            onChange={({ categoryId, categoryName }) => {
              setValue("categoryId", categoryId, { shouldValidate: true })
              setValue("categoryName", categoryName, { shouldValidate: true })
            }}
          />
          {categoryNameValue ? (
            <p className="text-xs text-primary">
              Se creará la categoría «{categoryNameValue}» al guardar el
              producto.
            </p>
          ) : categoryItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Opcional — aún no tienes categorías. Escribe un nombre (por
              ejemplo «Bebidas») y la crearemos al guardar el producto.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Opcional — escribe para buscar o crear una nueva. También puedes
              administrarlas en la sección de{" "}
              <Link
                href="/dashboard/business/categories/products"
                className="underline-offset-2 hover:text-white hover:underline"
              >
                Categorías
              </Link>
              .
            </p>
          )}
          {errors.categoryName && (
            <p className="text-xs text-destructive">
              {errors.categoryName.message}
            </p>
          )}
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
              min={0}
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

        {/* Precio de venta + moneda en la que se cobra */}
        <div className="grid gap-4 sm:grid-cols-2 mb-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="price" className="text-card-foreground">
              Precio de venta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min={0}
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
