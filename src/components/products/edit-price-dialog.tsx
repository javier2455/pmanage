"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
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
import { cn } from "@/lib/utils"
import { useBusiness } from "@/context/business-context"
import { useUpdateBusinessProductPriceMutation } from "@/hooks/use-product"
import {
    UpdateBusinessProductPriceFormData,
    updateBusinessProductPriceSchema,
} from "@/lib/validations/products"

interface EditPriceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    businessProductId: string
    productId: string
    productName: string
    currentPrice: number
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
    }).format(value)
}

export function EditPriceDialog({
    open,
    onOpenChange,
    businessProductId,
    productId,
    productName,
    currentPrice,
}: EditPriceDialogProps) {
    const { activeBusinessId } = useBusiness()
    const updateBusinessProductPriceMutation = useUpdateBusinessProductPriceMutation()

    const {
        register,
        handleSubmit,
        setError,
        reset,
        watch,
        formState: { errors },
    } = useForm<UpdateBusinessProductPriceFormData>({
        resolver: zodResolver(updateBusinessProductPriceSchema),
        defaultValues: { price: currentPrice },
    })

    React.useEffect(() => {
        if (open) reset({ price: currentPrice })
    }, [open, currentPrice, reset])

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

    async function onSubmit(formData: UpdateBusinessProductPriceFormData) {
        try {
            await updateBusinessProductPriceMutation.mutateAsync({
                businessProductId,
                price: formData.price,
                businessId: activeBusinessId ?? "",
                productId,
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar precio</DialogTitle>
                    <DialogDescription className="truncate">
                        {productName}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="edit-price-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-3"
                >
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
                    {errors.root && (
                        <p className="text-xs text-destructive">{errors.root.message}</p>
                    )}
                </form>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={updateBusinessProductPriceMutation.isPending}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="edit-price-form"
                        disabled={updateBusinessProductPriceMutation.isPending}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {updateBusinessProductPriceMutation.isPending
                            ? "Actualizando..."
                            : "Actualizar precio"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
