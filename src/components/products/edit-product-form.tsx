"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useBusiness } from "@/context/business-context"
import { useUpdateBusinessProductPriceMutation } from "@/hooks/use-product"
import type { ProductToShowInTable } from "@/lib/types/product"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { X, RefreshCw } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    UpdateBusinessProductPriceFormData,
    updateBusinessProductPriceSchema,
} from "@/lib/validations/products"
import axios from "axios"
import { sileo } from "sileo"
import Link from "next/link"

function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
    }).format(value)
}

export function EditProductForm() {
    const router = useRouter()
    const { businessProductId: businessProductIdParam } = useParams()
    const businessProductId = (businessProductIdParam as string) ?? ""
    const { activeBusinessId } = useBusiness()
    const queryClient = useQueryClient()

    const updateBusinessProductPriceMutation = useUpdateBusinessProductPriceMutation()

    const cachedBusinessProducts = queryClient.getQueryData<{ data: ProductToShowInTable[] }>([
        "all-product-of-my-businesses",
        activeBusinessId,
    ])
    const row = cachedBusinessProducts?.data?.find(
        (item) => item.id === businessProductId,
    )
    const currentPrice = row?.price !== undefined ? Number(row.price) : undefined
    const productName = row?.product?.name

    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors },
    } = useForm<UpdateBusinessProductPriceFormData>({
        resolver: zodResolver(updateBusinessProductPriceSchema),
        defaultValues: {
            price: undefined as unknown as number,
        },
    })

    useEffect(() => {
        if (currentPrice === undefined) return
        reset({ price: currentPrice }, { keepDirtyValues: true })
    }, [currentPrice, reset])

    async function onSubmit(formData: UpdateBusinessProductPriceFormData) {
        try {
            await updateBusinessProductPriceMutation.mutateAsync({
                businessProductId: businessProductId,
                price: formData.price,
            })
            sileo.success({
                title: "Precio actualizado correctamente",
                fill: "",
                styles: {
                    title: "text-white! text-[16px]! font-bold!",
                    description: "text-white/90! text-[15px]!",
                },
                description: "El precio del producto se ha actualizado correctamente",
            })
            router.push("/dashboard/business/products")
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

    if (!row) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
                <p className="text-muted-foreground text-center">
                    No se encontró el producto en el negocio activo. Vuelve a la lista de productos y
                    abre la edición desde la tabla.
                </p>
                <Link
                    href="/dashboard/business/products"
                    className="text-sm text-primary hover:underline"
                >
                    Volver a productos
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">Producto</p>
                    <p className="text-base font-medium text-card-foreground">
                        {productName ?? "--"}
                    </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <span className="text-sm text-muted-foreground">Precio actual</span>
                    <span className="text-base font-semibold text-card-foreground tabular-nums">
                        {currentPrice !== undefined ? formatCurrency(currentPrice) : "--"}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="product-price" className="text-card-foreground">
                        Nuevo precio <span className="text-destructive">*</span>
                    </Label>
                    <Input
                        id="product-price"
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
                    {errors.root && (
                        <p className="text-xs text-destructive">{errors.root.message}</p>
                    )}
                </div>

                <Separator />

                <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="default" asChild>
                        <Link href="/dashboard/business/products">
                            <X className="mr-2 h-4 w-4" />
                            Cancelar
                        </Link>
                    </Button>
                    <Button type="submit" disabled={updateBusinessProductPriceMutation.isPending}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {updateBusinessProductPriceMutation.isPending ? "Actualizando..." : "Actualizar precio"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
