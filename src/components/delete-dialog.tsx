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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

type DeleteDialogType = 'Producto' | 'Venta' | 'Entrada' | 'Negocio'

interface DeleteDialogProps {
    deleteType: DeleteDialogType
    name: string
    onConfirm: () => void | Promise<void>
    trigger?: React.ReactNode
    tooltip?: string
}

export function DeleteDialog({ deleteType, name, onConfirm, trigger, tooltip }: DeleteDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const triggerContent = trigger ?? <Button variant="outline">Open Dialog</Button>

    async function handleConfirm() {
        setIsLoading(true)
        try {
            await onConfirm()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog>
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
            <DialogContent className="sm:max-w-[425px] md:max-w-[520px] shadow-lg shadow-destructive/10">
                <DialogHeader className="gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="size-5 text-destructive" />
                        </div>
                        <DialogTitle className="text-base font-semibold text-foreground">
                            Eliminar {deleteType}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                        ¿Estás seguro de querer eliminar este {deleteType.toLowerCase()} — <span className="font-bold text-white">{name}</span>? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" type="button" disabled={isLoading}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={isLoading}
                        onClick={handleConfirm}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                Eliminando...
                            </>
                        ) : (
                            "Eliminar"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

