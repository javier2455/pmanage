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

/**
 * CUP_TRANSFERENCIA se guarda como una moneda más: su tasa es cuántas CUP vale 1
 * unidad, igual que USD o EURO. Un recargo del 20% equivale a una tasa < 1
 * (0.8333 = 1 / 1.20), porque cobrar por transferencia da MENOS valor por CUP
 * (100 CUP / 0.8333 ≈ 120 transferencia). Para que el usuario no calcule ese
 * inverso a mano, declara el % de recargo y lo traducimos a la tasa.
 */
const TRANSFER_CODE = "CUP_TRANSFERENCIA" as const
const TRANSFER_QUICK_PERCENTS = [10, 20, 30] as const

/** Tasa (0.8333) → texto de porcentaje de recargo ("20"). Vacío si no es válida. */
function rateToPercentText(rate: unknown): string {
    const r = Number(rate)
    if (!Number.isFinite(r) || r <= 0) return ""
    // Redondeo a 2 decimales para evitar ruido binario al invertir la tasa.
    return String(Math.round((1 / r - 1) * 100 * 100) / 100)
}

/** Texto de porcentaje ("20") → tasa inversa (0.8333). `undefined` si inválido. */
function percentToRate(percentText: string): number | undefined {
    const pct = parseFloat(percentText)
    if (!Number.isFinite(pct) || pct < 0) return undefined
    return Math.round((1 / (1 + pct / 100)) * 10000) / 10000
}

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

    // % de recargo mostrado para CUP_TRANSFERENCIA. Es estado propio (no derivado
    // del valor del form) para que escribir decimales no provoque saltos de cursor.
    const [transferPercent, setTransferPercent] = useState<string>(() =>
        rateToPercentText(currentData?.[TRANSFER_CODE]),
    )
    // Re-sincroniza el % cuando llegan datos nuevos del servidor (carga o refetch
    // tras guardar). Ajuste de estado en render (patrón recomendado por React) en
    // vez de un effect: no interfiere al escribir porque `currentData` solo cambia
    // de referencia cuando react-query trae datos distintos.
    const [prevData, setPrevData] = useState(currentData)
    if (currentData !== prevData) {
        setPrevData(currentData)
        setTransferPercent(rateToPercentText(currentData?.[TRANSFER_CODE]))
    }

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
        if (code === TRANSFER_CODE) setTransferPercent("")
    }

    /** Aplica un % de recargo: guarda el texto y traduce a la tasa multiplicador. */
    function applyTransferPercent(percentText: string) {
        setTransferPercent(percentText)
        const rate = percentToRate(percentText)
        if (rate != null) {
            setValue(TRANSFER_CODE, rate, { shouldValidate: true })
            clearErrors(TRANSFER_CODE)
        } else {
            setValue(TRANSFER_CODE, undefined)
        }
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

                                // CUP_TRANSFERENCIA: en vez de la tasa cruda, el usuario
                                // declara el % de recargo (botones rápidos + input libre).
                                if (code === TRANSFER_CODE) {
                                    const previewRate = percentToRate(transferPercent)
                                    return (
                                        <div key={code} className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                                            {/* La tasa real (multiplicador) vive en el form vía setValue; este
                                                input oculto la mantiene registrada para que se envíe al guardar. */}
                                            <input type="hidden" {...register(code, { valueAsNumber: true })} />
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={code} className="text-card-foreground">
                                                    {LABEL_BY_CODE.get(code) ?? code} — recargo
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
                                            <div className="flex gap-2">
                                                {TRANSFER_QUICK_PERCENTS.map((p) => {
                                                    const active = Number(transferPercent) === p
                                                    return (
                                                        <Button
                                                            key={p}
                                                            type="button"
                                                            variant={active ? "default" : "outline"}
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={() => applyTransferPercent(String(p))}
                                                        >
                                                            {p}%
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                            <InputGroup>
                                                <InputGroupInput
                                                    id={code}
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    placeholder="Otro %"
                                                    value={transferPercent}
                                                    onChange={(e) => applyTransferPercent(e.target.value)}
                                                    aria-invalid={errors[code] ? "true" : "false"}
                                                />
                                                <InputGroupAddon align="inline-end">%</InputGroupAddon>
                                            </InputGroup>
                                            {previewRate != null ? (
                                                <p className="text-xs text-muted-foreground">
                                                    100 CUP se cobran como {Math.round(100 / previewRate)} CUP
                                                    Transferencia (tasa guardada {previewRate}).
                                                </p>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    Elige un % o escríbelo: 20% cobra 120 por cada 100 CUP.
                                                </p>
                                            )}
                                            {currentValue > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    Valor actual: {rateToPercentText(currentValue)}% (tasa {currentValue})
                                                </p>
                                            )}
                                            {errors[code] && (
                                                <p className="text-xs text-destructive">{errors[code]?.message}</p>
                                            )}
                                        </div>
                                    )
                                }

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
