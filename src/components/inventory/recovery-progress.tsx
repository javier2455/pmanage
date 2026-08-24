"use client";

import { cn } from "@/lib/utils";

export interface ProgressSegment {
    /** Ancho del tramo, en porcentaje del total de la barra. */
    pct: number;
    className: string;
}

interface RecoveryProgressProps {
    segments: ProgressSegment[];
    /** Va al `aria-label` de la barra: qué se está midiendo. */
    label: string;
    /** Porcentaje ya capado a 100, para la lectura asistiva. */
    valueNow: number;
    /** Altura del riel. La fila de un lote la quiere más fina que el resumen. */
    size?: "sm" | "md";
    className?: string;
}

/**
 * Barra de varios tramos sobre un mismo total.
 *
 * No se usa una primitiva `ui/progress`: no existe en el proyecto y esta barra
 * no es un progreso de un solo valor, sino un reparto. Los tramos se pintan en
 * orden y su ancho ya viene calculado y recortado por
 * `buildRecoverySegments`, que es donde se prueba que suman lo que deben.
 */
export function RecoveryProgress({
    segments,
    label,
    valueNow,
    size = "md",
    className,
}: RecoveryProgressProps) {
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(valueNow)}
            className={cn(
                "flex w-full overflow-hidden rounded-full bg-muted",
                size === "sm" ? "h-1.5" : "h-2.5",
                className,
            )}
        >
            {segments.map((segment, index) => (
                <div
                    key={index}
                    aria-hidden="true"
                    className={cn("h-full transition-all duration-500", segment.className)}
                    style={{ width: `${Math.max(0, segment.pct)}%` }}
                />
            ))}
        </div>
    );
}
