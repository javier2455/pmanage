"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ProductImage } from "@/components/products/product-image"
import { useGetSaleById } from "@/hooks/use-sales"
import { BASE_CURRENCY, formatMoney } from "@/lib/currency"
import { isIntegerUnit } from "@/lib/units"
import type { CancelSaleProps } from "@/lib/types/sales"

type Mode = "full" | "partial"

/** Estado editable por línea en modo parcial. */
interface ItemState {
    selected: boolean
    /** Unidades que vuelven al stock (el resto de la línea es pérdida). */
    returnQty: number
    reason: string
}

interface CancelSaleDialogProps {
    saleId: string
    onConfirm: (body: CancelSaleProps) => void | Promise<void>
    trigger?: React.ReactNode
    tooltip?: string
    /** Modo controlado (p. ej. desde el detalle de la venta). */
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CancelSaleDialog({
    saleId,
    onConfirm,
    trigger,
    tooltip,
    open,
    onOpenChange,
}: CancelSaleDialogProps) {
    const isControlled = open !== undefined
    const [internalOpen, setInternalOpen] = useState(false)
    const isOpen = isControlled ? open : internalOpen

    const [mode, setMode] = useState<Mode>("full")
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [itemState, setItemState] = useState<Record<string, ItemState>>({})

    // Solo traemos los ítems cuando hace falta (diálogo abierto). Reaprovecha el
    // cache de `useGetSaleById` que ya usa el detalle de la venta.
    const { data: sale, isLoading: isLoadingSale } = useGetSaleById(
        isOpen ? saleId : "",
    )
    const currency = sale?.currency ?? BASE_CURRENCY
    const activeItems = (sale?.items ?? []).filter((i) => !i.isCancelled)

    // Inicializa el estado por línea al abrir / cargar los ítems.
    useEffect(() => {
        if (!isOpen) return
        const next: Record<string, ItemState> = {}
        for (const item of activeItems) {
            next[item.id] = { selected: false, returnQty: Number(item.quantity), reason: "" }
        }
        setItemState(next)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, sale?.id, activeItems.length])

    function setOpen(value: boolean) {
        if (isControlled) onOpenChange?.(value)
        else setInternalOpen(value)
        if (!value) {
            setMode("full")
            setReason("")
            setSubmitted(false)
            setItemState({})
        }
    }

    function updateItem(itemId: string, patch: Partial<ItemState>) {
        setItemState((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
    }

    const selectedItems = activeItems.filter((i) => itemState[i.id]?.selected)
    const reasonInvalid = submitted && !reason.trim()
    const noItemsSelected = mode === "partial" && submitted && selectedItems.length === 0

    async function handleConfirm() {
        setSubmitted(true)
        if (!reason.trim()) return
        if (mode === "partial" && selectedItems.length === 0) return

        const body: CancelSaleProps =
            mode === "full"
                ? { cancellationReason: reason.trim() }
                : {
                      cancellationReason: reason.trim(),
                      items: selectedItems.map((item) => {
                          const st = itemState[item.id]
                          return {
                              itemId: item.id,
                              quantity: st.returnQty,
                              ...(st.reason.trim()
                                  ? { cancellationReason: st.reason.trim() }
                                  : {}),
                          }
                      }),
                  }

        setIsLoading(true)
        try {
            await onConfirm(body)
            setOpen(false)
        } finally {
            setIsLoading(false)
        }
    }

    const triggerContent = trigger ?? <Button variant="outline">Cancelar venta</Button>

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {tooltip ? (
                        <span className="inline-flex">
                            <Tooltip>
                                <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
                                <TooltipContent>{tooltip}</TooltipContent>
                            </Tooltip>
                        </span>
                    ) : (
                        triggerContent
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="flex max-h-[min(90vh,100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 shadow-lg shadow-destructive/30 sm:max-w-[460px] md:max-w-[560px]">
                <DialogHeader className="shrink-0 gap-3 border-b border-border p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="size-5 text-destructive" />
                        </div>
                        <DialogTitle className="text-base font-semibold text-foreground">
                            Cancelar venta
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                        Cancela la venta completa o devuelve solo algunos productos. Lo que
                        no se devuelva al stock se registra como pérdida. Esta acción no se
                        puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
                    {/* Selector de modo */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={mode === "full" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setMode("full")}
                            disabled={isLoading}
                        >
                            Venta completa
                        </Button>
                        <Button
                            type="button"
                            variant={mode === "partial" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setMode("partial")}
                            disabled={isLoading}
                        >
                            Por productos
                        </Button>
                    </div>

                    {/* Lista de productos (modo parcial) */}
                    {mode === "partial" && (
                        <div className="flex flex-col gap-2">
                            <Label className="text-card-foreground">
                                Productos a cancelar
                            </Label>
                            {isLoadingSale ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : activeItems.length === 0 ? (
                                <p className="rounded-md border border-border bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
                                    No hay productos activos para cancelar en esta venta.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {activeItems.map((item) => {
                                        const st = itemState[item.id]
                                        if (!st) return null
                                        const qty = Number(item.quantity)
                                        const integer = isIntegerUnit(item.product?.unit)
                                        const loss = Math.max(qty - st.returnQty, 0)
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 p-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={st.selected}
                                                        onCheckedChange={(v) =>
                                                            updateItem(item.id, {
                                                                selected: v === true,
                                                            })
                                                        }
                                                        disabled={isLoading}
                                                        aria-label={`Cancelar ${item.product?.name ?? "producto"}`}
                                                    />
                                                    <ProductImage
                                                        src={item.product?.imageUrl}
                                                        alt={item.product?.name ?? "Producto"}
                                                        size="sm"
                                                    />
                                                    <div className="flex min-w-0 flex-1 flex-col">
                                                        <span className="truncate text-sm font-medium text-card-foreground">
                                                            {item.product?.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground tabular-nums">
                                                            {qty} ×{" "}
                                                            {formatMoney(Number(item.price), currency)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {st.selected && (
                                                    <div className="flex flex-col gap-2 pl-7">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Label
                                                                htmlFor={`return-${item.id}`}
                                                                className="text-xs text-muted-foreground"
                                                            >
                                                                Devolver al stock
                                                            </Label>
                                                            <Input
                                                                id={`return-${item.id}`}
                                                                type="number"
                                                                min={0}
                                                                max={qty}
                                                                step={integer ? 1 : "0.001"}
                                                                value={st.returnQty}
                                                                onChange={(e) => {
                                                                    const raw = Number(e.target.value)
                                                                    const clamped = Number.isFinite(raw)
                                                                        ? Math.min(Math.max(raw, 0), qty)
                                                                        : 0
                                                                    updateItem(item.id, {
                                                                        returnQty: clamped,
                                                                    })
                                                                }}
                                                                disabled={isLoading}
                                                                className="h-8 w-24 text-right tabular-nums"
                                                            />
                                                        </div>
                                                        {loss > 0 && (
                                                            <p className="text-right text-xs text-destructive tabular-nums">
                                                                Pérdida: {loss}
                                                            </p>
                                                        )}
                                                        <Input
                                                            value={st.reason}
                                                            onChange={(e) =>
                                                                updateItem(item.id, {
                                                                    reason: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Motivo del ítem (opcional)"
                                                            disabled={isLoading}
                                                            className="h-8"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {noItemsSelected && (
                                <p className="text-xs text-destructive">
                                    Selecciona al menos un producto.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Motivo global */}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="cancel-reason" className="text-card-foreground">
                            Razón de cancelación <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="cancel-reason"
                            placeholder="Ej: Cliente desistió de la compra..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                            aria-invalid={reasonInvalid}
                            disabled={isLoading}
                            autoFocus
                        />
                        {reasonInvalid && (
                            <p className="text-xs text-destructive">
                                La razón de cancelación es obligatoria.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="shrink-0 gap-2 border-t border-border p-6 sm:gap-2">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            type="button"
                            disabled={isLoading}
                            className="cursor-pointer"
                        >
                            Regresar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={
                            isLoading ||
                            (mode === "partial" && activeItems.length === 0)
                        }
                        onClick={handleConfirm}
                        className="cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Cancelando...
                            </>
                        ) : mode === "full" ? (
                            "Cancelar venta"
                        ) : (
                            "Cancelar productos"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
