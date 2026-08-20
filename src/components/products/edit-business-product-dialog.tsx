"use client"

import * as React from "react"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { isAxiosError } from "axios"
import { toastApiError, toastSuccess } from "@/lib/toast"
import { ArrowDown, ArrowUp, RefreshCw, X } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { cn } from "@/lib/utils"
import { useBusiness } from "@/context/business-context"
import {
    useUpdateBusinessProductCategoryMutation,
    useUpdateBusinessProductPriceMutation,
} from "@/hooks/use-product"
import { useGetAllProductCategoriesQuery } from "@/hooks/use-product-categories"
import { useExchangeRate } from "@/hooks/use-exchange"
import { AmountCurrencyField } from "@/components/products/amount-currency-field"
import {
    BASE_CURRENCY,
    convertToBase,
    currencyLabel,
    formatMoney,
    getAvailableCurrencies,
    getCurrencyRate,
    roundMoney,
} from "@/lib/currency"
import {
    EditBusinessProductFormData,
    editBusinessProductSchema,
    MAX_PRODUCT_PRICE,
} from "@/lib/validations/products"

interface EditBusinessProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    businessProductId: string
    productId: string
    productName: string
    currentPrice: number
    currentCategoryId: string | null
}

type CategoryOption = { id: string; name: string }

/**
 * Los precios del catálogo se guardan en CUP; formatearlos como pesos
 * colombianos era solo un resto del formato por defecto y confundía justo aquí,
 * donde ahora conviven dos monedas.
 */
export function EditBusinessProductDialog({
    open,
    onOpenChange,
    businessProductId,
    productId,
    productName,
    currentPrice,
    currentCategoryId,
}: EditBusinessProductDialogProps) {
    const { activeBusinessId } = useBusiness()
    const updatePriceMutation = useUpdateBusinessProductPriceMutation()
    const updateCategoryMutation = useUpdateBusinessProductCategoryMutation()
    // Tasas del negocio para poder fijar el precio en otra moneda. El precio se
    // persiste siempre en CUP. Ver docs/moneda-precio-venta.md.
    const { data: exchangeRateData } = useExchangeRate(activeBusinessId ?? "")
    const exchange = exchangeRateData?.data
    const availableCurrencies = getAvailableCurrencies(exchange)

    // La categoría vive en el BusinessProduct; se edita aquí. Ver docs/category.md.
    const { data: categoriesData, isLoading: isLoadingCategories } =
        useGetAllProductCategoriesQuery({
            page: 1,
            limit: 1000,
            businessId: activeBusinessId ?? undefined,
            enabled: open && !!activeBusinessId,
        })
    const productCategories = categoriesData?.data ?? []

    const {
        register,
        handleSubmit,
        control,
        setError,
        reset,
        watch,
        formState: { errors },
    } = useForm<EditBusinessProductFormData>({
        resolver: zodResolver(editBusinessProductSchema),
        defaultValues: {
            price: currentPrice,
            priceInputCurrency: BASE_CURRENCY,
            categoryId: currentCategoryId,
        },
    })

    React.useEffect(() => {
        if (open)
            reset({
                // El precio guardado está en CUP, así que el diálogo abre siempre
                // en la moneda base: `priceCurrency` del backend describe el
                // importe guardado (CUP), no la moneda en la que se cotizó.
                price: currentPrice,
                priceInputCurrency: BASE_CURRENCY,
                categoryId: currentCategoryId,
            })
    }, [open, currentPrice, currentCategoryId, reset])

    const watchedPrice = watch("price")
    const priceCurrency = watch("priceInputCurrency") ?? BASE_CURRENCY
    const priceRate = getCurrencyRate(exchange, priceCurrency)
    // El precio nuevo, ya en CUP: es la única forma de compararlo con el actual.
    const newPrice =
        typeof watchedPrice === "number" &&
        !Number.isNaN(watchedPrice) &&
        priceRate !== null
            ? roundMoney(convertToBase(watchedPrice, priceCurrency, exchange))
            : undefined
    const delta =
        newPrice !== undefined && newPrice !== currentPrice
            ? newPrice - currentPrice
            : 0
    const deltaPct =
        currentPrice > 0 && delta !== 0 ? (delta / currentPrice) * 100 : 0

    const isSaving =
        updatePriceMutation.isPending || updateCategoryMutation.isPending

    async function onSubmit(formData: EditBusinessProductFormData) {
        const nextCategoryId = formData.categoryId ?? null
        const selectedCurrency = formData.priceInputCurrency ?? BASE_CURRENCY
        const rate = getCurrencyRate(exchange, selectedCurrency)
        // El backend rechaza la moneda sin tasa; avisamos antes de enviar para
        // poder señalar el campo.
        if (rate === null) {
            setError("price", {
                message: `La moneda ${currencyLabel(selectedCurrency)} no tiene tasa configurada. Configúrala en Tasas de cambio o fija el precio en ${currencyLabel(BASE_CURRENCY)}.`,
            })
            return
        }
        // El endpoint guarda el precio en CUP; calculamos el equivalente para
        // comparar con el actual y validar el tope, pero se envía sin convertir.
        const nextPrice = roundMoney(
            convertToBase(formData.price, selectedCurrency, exchange),
        )
        if (nextPrice > MAX_PRODUCT_PRICE) {
            setError("price", {
                message: `El precio equivale a ${formatMoney(nextPrice, BASE_CURRENCY)} y el máximo es ${formatMoney(MAX_PRODUCT_PRICE, BASE_CURRENCY)}.`,
            })
            return
        }
        const priceChanged = nextPrice !== currentPrice
        const categoryChanged = nextCategoryId !== (currentCategoryId ?? null)

        if (!priceChanged && !categoryChanged) {
            onOpenChange(false)
            return
        }

        try {
            // Precio y categoría viajan a endpoints distintos; solo enviamos los
            // que cambiaron. Ver docs/backend-categoria-business-product.md.
            if (priceChanged) {
                await updatePriceMutation.mutateAsync({
                    businessProductId,
                    price: formData.price,
                    priceCurrency: selectedCurrency,
                    priceExchangeRateApplied:
                        selectedCurrency !== BASE_CURRENCY ? rate : undefined,
                    businessId: activeBusinessId ?? "",
                    productId,
                })
            }
            if (categoryChanged) {
                await updateCategoryMutation.mutateAsync({
                    businessProductId,
                    categoryId: nextCategoryId,
                    businessId: activeBusinessId ?? "",
                    productId,
                })
            }

            toastSuccess({
                title: "Producto actualizado correctamente",
                description:
                    priceChanged && categoryChanged
                        ? "Se actualizaron el precio y la categoría del producto"
                        : priceChanged
                          ? "El precio del producto se ha actualizado correctamente"
                          : "La categoría del producto se ha actualizado correctamente",
            })
            onOpenChange(false)
        } catch (error) {
            const fallback = "Error al actualizar el producto. Intenta de nuevo."
            const message = isAxiosError(error)
                ? error.response?.data?.message ?? fallback
                : fallback
            toastApiError(error, fallback)
            setError("root", { message })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md"
                // El popup del Combobox (Base UI) se portaliza al body, fuera del
                // contenido del Dialog (Radix). Sin esto, Radix lo trata como un clic
                // "fuera" y cierra el modal / bloquea la selección de categoría.
                onPointerDownOutside={(e) => {
                    if (
                        (e.target as Element | null)?.closest(
                            "[data-slot=combobox-content]",
                        )
                    ) {
                        e.preventDefault()
                    }
                }}
                onInteractOutside={(e) => {
                    if (
                        (e.target as Element | null)?.closest(
                            "[data-slot=combobox-content]",
                        )
                    ) {
                        e.preventDefault()
                    }
                }}
            >
                <DialogHeader>
                    <DialogTitle>Editar producto</DialogTitle>
                    <DialogDescription className="truncate">
                        {productName}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="edit-business-product-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-3"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="product-price" className="text-card-foreground">
                                Precio <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="product-price"
                                type="number"
                                min={1}
                                step="0.01"
                                placeholder="0.00"
                                autoFocus
                                {...register("price", { valueAsNumber: true })}
                                aria-invalid={errors.price ? "true" : "false"}
                            />
                        </div>
                        {/* Moneda en la que se cobra: el precio se guarda convertido a CUP. */}
                        <Controller
                            control={control}
                            name="priceInputCurrency"
                            render={({ field }) => (
                                <AmountCurrencyField
                                    id="product-price-currency"
                                    label="Moneda del precio"
                                    currency={field.value ?? BASE_CURRENCY}
                                    onCurrencyChange={field.onChange}
                                    availableCurrencies={availableCurrencies}
                                    amount={Number(watchedPrice) || 0}
                                    exchangeRate={exchange}
                                />
                            )}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">
                            Actual:{" "}
                            <span className="font-medium text-foreground tabular-nums">
                                {formatMoney(currentPrice, BASE_CURRENCY)}
                            </span>
                        </span>
                        {delta !== 0 && newPrice !== undefined && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                                    delta > 0
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                                )}
                            >
                                {delta > 0 ? (
                                    <ArrowUp className="size-3" />
                                ) : (
                                    <ArrowDown className="size-3" />
                                )}
                                {delta > 0 ? "+" : ""}
                                {formatMoney(delta, BASE_CURRENCY)} ({deltaPct > 0 ? "+" : ""}
                                {deltaPct.toFixed(1)}%)
                            </span>
                        )}
                    </div>

                    {errors.price && (
                        <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}

                    {/* Categoría — se actualiza en el BusinessProduct */}
                    <div className="mt-1 flex flex-col gap-2">
                        <Label htmlFor="category-select" className="text-card-foreground">
                            Categoría
                        </Label>
                        <Controller
                            control={control}
                            name="categoryId"
                            render={({ field }) => {
                                const items: CategoryOption[] = productCategories.map(
                                    (c) => ({ id: c.id, name: c.name }),
                                )
                                const selectedOption: CategoryOption | null =
                                    items.find((i) => i.id === field.value) ?? null
                                return (
                                    <Combobox<CategoryOption | null>
                                        value={selectedOption}
                                        onValueChange={(opt) =>
                                            field.onChange(opt?.id ?? null)
                                        }
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
                                            disabled={
                                                isLoadingCategories || items.length === 0
                                            }
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
                            Opcional — déjala vacía para quitar la categoría. Adminístralas en la sección de{" "}
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

                    {errors.root && (
                        <p className="text-xs text-destructive">{errors.root.message}</p>
                    )}
                </form>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="edit-business-product-form"
                        disabled={isSaving}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
