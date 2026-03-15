"use client"

import * as React from "react"
import { useState } from "react"
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface CancelSaleDialogProps {
    productName: string
    onConfirm: (description: string) => void | Promise<void>
    trigger?: React.ReactNode
    tooltip?: string
}

export function CancelSaleDialog({ productName, onConfirm, trigger, tooltip }: CancelSaleDialogProps) {
    const [open, setOpen] = useState(false)
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const triggerContent = trigger ?? <Button variant="outline">Cancelar venta</Button>

    async function handleConfirm() {
        if (!description.trim()) return
        setIsLoading(true)
        try {
            await onConfirm(description.trim())
            setOpen(false)
            setDescription("")
        } finally {
            setIsLoading(false)
        }
    }

    function handleOpenChange(value: boolean) {
        if (!value) setDescription("")
        setOpen(value)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {tooltip ? (
                    <span className="inline-flex">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {triggerContent}
                            </TooltipTrigger>
                            <TooltipContent>{tooltip}</TooltipContent>
                        </Tooltip>
                    </span>
                ) : triggerContent}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-[520px] shadow-lg shadow-destructive/30">
                <DialogHeader className="gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="size-5 text-destructive" />
                        </div>
                        <DialogTitle className="text-base font-semibold text-foreground">
                            Cancelar venta
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                        ¿Estás seguro de querer cancelar la venta de{" "}
                        <span className="font-bold text-foreground">{productName}</span>?
                        El stock del producto se restablecerá. Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="cancel-reason" className="text-card-foreground">
                        Razón de cancelación
                    </Label>
                    <Input
                        id="cancel-reason"
                        placeholder="Ej: Cliente desistió de la compra..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                        aria-invalid={!description.trim() && isLoading}
                        disabled={isLoading}
                        autoFocus
                    />
                    {!description.trim() && isLoading && (
                        <p className="text-xs text-destructive">La razón de cancelación es obligatoria.</p>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" type="button" disabled={isLoading}>
                            Regresar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isLoading || !description.trim()}
                        onClick={handleConfirm}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Cancelando venta...
                            </>
                        ) : (
                            "Cancelar venta"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
