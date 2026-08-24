"use client";

import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/currency";
import { cn, DASH } from "@/lib/utils";

/** Cuál de los dos números manda: el dinero o el porcentaje. */
export type MarginEmphasis = "money" | "percent";

interface MarginValueProps {
    /** Importe ya convertido a `currency`. */
    amount: number;
    marginPct: number | null;
    currency: string;
    emphasis: MarginEmphasis;
    /** `kpi` para una tarjeta de cabecera, `row` para una fila de lote. */
    size?: "kpi" | "row";
    className?: string;
}

/**
 * Una ganancia con su margen, en dinero y en porcentaje.
 *
 * El conmutador de la vista no oculta ninguno de los dos: decide cuál se pinta
 * grande. Esconder uno obligaría a cambiar de modo para comparar, que es
 * justamente lo que se hace todo el rato —un 20 % dice si el negocio es sano y
 * los pesos dicen si da para vivir—.
 */
export function MarginValue({
    amount,
    marginPct,
    currency,
    emphasis,
    size = "row",
    className,
}: MarginValueProps) {
    const isPositive = amount >= 0;
    const toneClass = isPositive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-destructive";

    const money = Number.isFinite(amount)
        ? formatMoney(amount, currency)
        : DASH;
    const percent = marginPct === null ? DASH : `${marginPct.toFixed(1)}%`;

    if (emphasis === "percent") {
        return (
            <span className={cn("flex flex-wrap items-baseline gap-2", className)}>
                <span
                    className={cn(
                        "font-bold tabular-nums",
                        size === "kpi" ? "text-2xl" : "text-sm",
                        toneClass,
                    )}
                >
                    {percent}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                    {money}
                </span>
            </span>
        );
    }

    return (
        <span className={cn("flex flex-wrap items-center gap-2", className)}>
            <span
                className={cn(
                    "font-bold tabular-nums",
                    size === "kpi" ? "text-2xl" : "text-sm",
                    toneClass,
                )}
            >
                {money}
            </span>
            {marginPct !== null && (
                <Badge
                    variant="secondary"
                    className={cn(
                        "text-xs tabular-nums",
                        marginPct < 0 &&
                            "border-destructive/20 bg-destructive/10 text-destructive",
                    )}
                >
                    {percent}
                </Badge>
            )}
        </span>
    );
}
