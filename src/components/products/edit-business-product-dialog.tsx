"use client"

import * as React from "react"
import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { sileo } from "sileo"
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
import {
    EditBusinessProductFormData,
    editBusinessProductSchema,
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

function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
    }).format(value)
}

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
        defaultValues: { price: currentPrice, categoryId: currentCategoryId },
    })

    React.useEffect(() => {
        if (open) reset({ price: currentPrice, categoryId: currentCategoryId })
    }, [open, currentPrice, currentCategoryId, reset])

    const watchedPrice = watch("price")
    const newPrice =
        typeof watchedPrice === "number" && !Number.isNaN(watchedPrice)
            ? watchedPrice
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
        const priceChanged = formData.price !== currentPrice
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

            sileo.success({
                title: "Producto actualizado correctamente",
                fill: "",
                styles: {
                    title: "text-white! text-[16px]! font-bold!",
                    description: "text-white/90! text-[15px]!",
                },
                description:
                    priceChanged && categoryChanged
                        ? "Se actualizaron el precio y la categoría del producto"
                        : priceChanged
                          ? "El precio del producto se ha actualizado correctamente"
                          : "La categoría del producto se ha actualizado correctamente",
            })
            onOpenChange(false)
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                setError("root", { message: error.response.data.message })
                sileo.error({
                    title: error.response?.data?.error,
                    styles: { description: "text-[#dc2626]/90! text-[15px]!" },
                    description: error.response?.data?.message,
                })
            }
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

                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">
                            Actual:{" "}
                            <span className="font-medium text-foreground tabular-nums">
                                {formatCurrency(currentPrice)}
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
                                {formatCurrency(delta)} ({deltaPct > 0 ? "+" : ""}
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
