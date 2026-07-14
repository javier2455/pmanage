"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, RefreshCw, X } from "lucide-react"
import { sileo } from "sileo"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCreateExchangeRateMutation, useUpdateExchangeRateMutation } from "@/hooks/use-exchange"
import { exchangeRateSchema, ExchangeRateFormData } from "@/lib/validations/exchange-rate"
import { ExchangeRateTypeOne, ExchangeRatePayload } from "@/lib/types/exchange-rate"
import {
    EXCHANGE_CURRENCIES,
    KNOWN_CURRENCY_CODES,
    type ExchangeCurrencyCode,
} from "@/lib/currency"
import { CurrencyIcon } from "./currency-icons"

interface ExchangeRateFormProps {
    businessId: string
    currentData: ExchangeRateTypeOne | null
}

const LABEL_BY_CODE = new Map(EXCHANGE_CURRENCIES.map((c) => [c.code, c.label]))

/** Códigos con tasa > 0 en los datos actuales. */
function activeCodesFromData(data: ExchangeRateTypeOne | null): ExchangeCurrencyCode[] {
    if (!data) return []
    return KNOWN_CURRENCY_CODES.filter((code) => Number(data[code]) > 0)
}

/** Valores del formulario derivados de los datos: solo monedas con tasa > 0. */
function formValuesFromData(data: ExchangeRateTypeOne | null): ExchangeRateFormData {
    const values: ExchangeRateFormData = {}
    if (!data) return values
    for (const code of KNOWN_CURRENCY_CODES) {
        const value = Number(data[code])
        if (value > 0) values[code] = value
    }
    return values
}

export default function ExchangeRateForm({ businessId, currentData }: ExchangeRateFormProps) {
    const isEditing = currentData !== null

    const createMutation = useCreateExchangeRateMutation()
    const updateMutation = useUpdateExchangeRateMutation()

    const isPending = createMutation.isPending || updateMutation.isPending

    const [activeCodes, setActiveCodes] = useState<ExchangeCurrencyCode[]>(() =>
        activeCodesFromData(currentData),
    )

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm<ExchangeRateFormData>({
        resolver: zodResolver(exchangeRateSchema),
        defaultValues: formValuesFromData(currentData),
    })

    const inactiveCodes = KNOWN_CURRENCY_CODES.filter((code) => !activeCodes.includes(code))

    function addCurrency(code: ExchangeCurrencyCode) {
        setActiveCodes((prev) => (prev.includes(code) ? prev : [...prev, code]))
    }

    function removeCurrency(code: ExchangeCurrencyCode) {
        setActiveCodes((prev) => prev.filter((c) => c !== code))
        setValue(code, undefined)
        clearErrors(code)
    }

    async function onSubmit(formData: ExchangeRateFormData) {
        // Construir payload con las 10 monedas: activas con su valor, el resto en 0
        // (así las quitadas dejan de estar disponibles en el sistema).
        const payload: Omit<ExchangeRatePayload, "idbusiness"> = {}
        let hasError = false
        for (const code of KNOWN_CURRENCY_CODES) {
            if (activeCodes.includes(code)) {
                const value = formData[code]
                if (value == null || !(value > 0)) {
                    setError(code, { message: "Ingresa un valor mayor a 0" })
                    hasError = true
                    continue
                }
                payload[code] = value
            } else {
                payload[code] = 0
            }
        }
        if (hasError) return

        try {
            let response
            if (isEditing) {
                response = await updateMutation.mutateAsync({ businessId, payload })
            } else {
                response = await createMutation.mutateAsync({ idbusiness: businessId, ...payload })
            }
            if (response?.data) {
                reset(formValuesFromData(response.data))
                setActiveCodes(activeCodesFromData(response.data))
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
                <CardTitle className="text-xl font-bold">Monedas del negocio</CardTitle>
                <CardDescription>
                    Selecciona las monedas que utilizas, asígnales su tasa en CUP y guarda los cambios.
                    Las monedas que agregues quedarán disponibles para ventas, gastos e inventario.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                    {activeCodes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aún no has agregado monedas. Usa el botón &quot;Agregar moneda&quot; para empezar.
                        </p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {activeCodes.map((code) => {
                                const currentValue = currentData ? Number(currentData[code]) : 0

                                return (
                                    <div key={code} className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={code} className="text-card-foreground">
                                                {LABEL_BY_CODE.get(code) ?? code} a CUP
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-6 text-muted-foreground hover:text-destructive"
                                                onClick={() => removeCurrency(code)}
                                                aria-label={`Quitar ${LABEL_BY_CODE.get(code) ?? code}`}
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                        <InputGroup>
                                            <InputGroupAddon>
                                                <CurrencyIcon code={code} className="size-4" />
                                            </InputGroupAddon>
                                            <InputGroupInput
                                                id={code}
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                aria-invalid={errors[code] ? "true" : "false"}
                                                {...register(code, { valueAsNumber: true })}
                                            />
                                        </InputGroup>
                                        {currentValue > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Valor actual: {currentValue} CUP
                                            </p>
                                        )}
                                        {errors[code] && (
                                            <p className="text-xs text-destructive">{errors[code]?.message}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button type="button" variant="outline" disabled={inactiveCodes.length === 0}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar moneda
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {inactiveCodes.map((code) => (
                                    <DropdownMenuItem key={code} onSelect={() => addCurrency(code)}>
                                        <CurrencyIcon code={code} className="mr-2 size-4" />
                                        {LABEL_BY_CODE.get(code) ?? code}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
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
