"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { DollarSign, Euro, CreditCard, RefreshCw } from "lucide-react"
import { sileo } from "sileo"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { useCreateExchangeRateMutation, useUpdateExchangeRateMutation } from "@/hooks/use-exchange"
import { exchangeRateSchema, ExchangeRateFormData } from "@/lib/validations/exchange-rate"
import { ExchangeRateTypeOne } from "@/lib/types/exchange-rate"

interface ExchangeRateFormProps {
    businessId: string
    currentData: ExchangeRateTypeOne | null
}

export default function ExchangeRateForm({ businessId, currentData }: ExchangeRateFormProps) {
    const isEditing = currentData !== null

    const createMutation = useCreateExchangeRateMutation()
    const updateMutation = useUpdateExchangeRateMutation()

    const isPending = createMutation.isPending || updateMutation.isPending

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<ExchangeRateFormData>({
        resolver: zodResolver(exchangeRateSchema),
        defaultValues: {
            USD: undefined,
            EURO: undefined,
            CUP_TRANSFERENCIA: undefined,
        },
    })

    useEffect(() => {
        if (!currentData) return
        reset({
            USD: currentData.USD,
            EURO: currentData.EURO,
            CUP_TRANSFERENCIA: currentData.CUP_TRANSFERENCIA,
        })
    }, [currentData, reset])

    async function onSubmit(formData: ExchangeRateFormData) {
        try {
            let response
            if (isEditing) {
                response = await updateMutation.mutateAsync({
                    businessId,
                    payload: {
                        USD: formData.USD,
                        EURO: formData.EURO,
                        CUP_TRANSFERENCIA: formData.CUP_TRANSFERENCIA,
                    },
                })
            } else {
                response = await createMutation.mutateAsync({
                    idbusiness: businessId,
                    USD: formData.USD,
                    EURO: formData.EURO,
                    CUP_TRANSFERENCIA: formData.CUP_TRANSFERENCIA,
                })
            }
            if (response?.data) {
                reset({
                    USD: response.data.USD ?? undefined,
                    EURO: response.data.EURO ?? undefined,
                    CUP_TRANSFERENCIA: response.data.CUP_TRANSFERENCIA ?? undefined,
                })
            }
            sileo.success({
                title: "Tasas actualizadas correctamente",
                fill: "",
                styles: {
                    title: "text-white! text-[16px]! font-bold!",
                    description: "text-white/90! text-[15px]!",
                },
                description: "Los valores de cambio se han guardado correctamente",
            })
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
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold">Actualizar tasas</CardTitle>
                <CardDescription>
                    Modifica los valores y guarda los cambios para actualizar las tasas vigentes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="usd" className="text-card-foreground">USD a MN</Label>
                            <InputGroup>
                                <InputGroupAddon>
                                    <DollarSign className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="usd"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    aria-invalid={errors.USD ? "true" : "false"}
                                    {...register("USD", { valueAsNumber: true })}
                                />
                            </InputGroup>
                            {currentData?.USD != null && (
                                <p className="text-xs text-muted-foreground">
                                    Valor actual: {currentData.USD} MN
                                </p>
                            )}
                            {errors.USD && (
                                <p className="text-xs text-destructive">{errors.USD.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="euro" className="text-card-foreground">EUR a MN</Label>
                            <InputGroup>
                                <InputGroupAddon>
                                    <Euro className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="euro"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    aria-invalid={errors.EURO ? "true" : "false"}
                                    {...register("EURO", { valueAsNumber: true })}
                                />
                            </InputGroup>
                            {currentData?.EURO != null && (
                                <p className="text-xs text-muted-foreground">
                                    Valor actual: {currentData.EURO} MN
                                </p>
                            )}
                            {errors.EURO && (
                                <p className="text-xs text-destructive">{errors.EURO.message}</p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="transferencia" className="text-card-foreground">Transferencia a MN</Label>
                            <InputGroup>
                                <InputGroupAddon>
                                    <CreditCard className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    id="transferencia"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    aria-invalid={errors.CUP_TRANSFERENCIA ? "true" : "false"}
                                    {...register("CUP_TRANSFERENCIA", { valueAsNumber: true })}
                                />
                            </InputGroup>
                            {currentData?.CUP_TRANSFERENCIA != null && (
                                <p className="text-xs text-muted-foreground">
                                    Valor actual: {currentData.CUP_TRANSFERENCIA} MN
                                </p>
                            )}
                            {errors.CUP_TRANSFERENCIA && (
                                <p className="text-xs text-destructive">{errors.CUP_TRANSFERENCIA.message}</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {isPending ? "Guardando..." : "Guardar cambios"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
