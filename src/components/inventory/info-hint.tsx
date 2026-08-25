"use client";

import * as React from "react";
import { Info } from "lucide-react";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InfoHintProps {
    /** Qué se explica. Sale del `aria-label` del disparador. */
    label: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * La explicación de una sección, guardada detrás de un icono.
 *
 * Estos textos son necesarios —sin ellos nadie entiende por qué el costo de una
 * venta pasada no cambia al comprar más caro— pero no son lo que el dueño viene
 * a mirar. En reposo ocupaban tanto como las cifras y cansaban la vista antes
 * de llegar al número.
 *
 * Va con `Popover` y no con `Tooltip` a propósito: el tooltip se abre al pasar
 * el ratón, y en un móvil eso no existe. Un clic funciona en los dos sitios.
 */
export function InfoHint({ label, children, className }: InfoHintProps) {
    return (
        <Popover>
            <PopoverTrigger
                className={cn(
                    "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    className,
                )}
                aria-label={`Cómo se calcula: ${label}`}
            >
                <Info className="size-3.5" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 space-y-2 text-sm"
            >
                {children}
            </PopoverContent>
        </Popover>
    );
}
