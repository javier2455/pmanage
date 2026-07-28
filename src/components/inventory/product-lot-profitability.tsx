"use client";

import * as React from "react";
import { TrendingUp, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductLotProfitability } from "@/hooks/use-inventory";
import type { LotProfitability } from "@/lib/types/inventory";
import { formatStockWithUnit } from "@/lib/units";
import { cn } from "@/lib/utils";

const DASH = "—";

function formatAmount(value: number, currency: string) {
    if (!Number.isFinite(value)) return DASH;
    const formatted = new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
    return `${formatted} ${currency}`;
}

function formatDate(value: string) {
    try {
        return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(new Date(value));
    } catch {
        return DASH;
    }
}

interface ProductLotProfitabilityProps {
    businessId: string;
    productId: string;
    /** Unidad del producto, para no mostrar "0,5 uds" donde toca "0,5 kg". */
    unit?: string | null;
    className?: string;
}

function CardShell({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4" aria-hidden="true" />
                    Rentabilidad por lote
                </CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

/**
 * Qué dejó cada compra: lo que costó frente a lo que se cobró por ella.
 *
 * Es la pregunta que el precio de entrada único no podía responder. Con un solo
 * escalar, comprar más caro reescribía hacia abajo el margen de lo ya vendido;
 * aquí cada lote conserva el suyo, así que se puede ver que dos compras que
 * dejan la misma ganancia por unidad no dejan el mismo margen.
 */
export function ProductLotProfitability({
    businessId,
    productId,
    unit,
    className,
}: ProductLotProfitabilityProps) {
    const { data, isLoading, isError } = useProductLotProfitability(
        businessId,
        productId,
    );

    if (isLoading) {
        return (
            <CardShell className={className}>
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </CardShell>
        );
    }

    if (isError || !data?.data) {
        return (
            <CardShell className={className}>
                <p className="text-sm text-muted-foreground">
                    No se pudo calcular la rentabilidad de este producto.
                </p>
            </CardShell>
        );
    }

    const { lots, unconvertedCurrencies, hasConvertedRevenue } = data.data;

    // Un lote del que no ha salido nada todavía no tiene nada que contar sobre
    // rentabilidad; aparece en "Lotes en stock", que es donde corresponde.
    const soldLots = lots.filter((lot) => lot.soldQuantity > 0);

    if (soldLots.length === 0) {
        return (
            <CardShell className={className}>
                <p className="text-sm text-muted-foreground">
                    Todavía no se ha vendido nada de este producto. Cuando salga la
                    primera unidad aparecerá aquí qué lote la surtió y con qué margen.
                </p>
            </CardShell>
        );
    }

    const totals = soldLots.reduce(
        (acc, lot) => ({
            revenue: acc.revenue + lot.revenueBase,
            cost: acc.cost + lot.costBase,
            profit: acc.profit + lot.grossProfitBase,
        }),
        { revenue: 0, cost: 0, profit: 0 },
    );
    const totalMargin =
        totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : null;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4" aria-hidden="true" />
                    Rentabilidad por lote
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Lo que costó cada compra frente a lo que se cobró por ella. Dos
                    lotes pueden dejar la misma ganancia por unidad y distinto margen.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                <ul className="space-y-2">
                    {soldLots.map((lot) => (
                        <LotRow key={lot.layerId} lot={lot} unit={unit} />
                    ))}
                </ul>

                <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ingreso total</span>
                        <span className="font-medium tabular-nums">
                            {formatAmount(totals.revenue, "CUP")}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Costo total</span>
                        <span className="font-medium tabular-nums text-destructive">
                            -{formatAmount(totals.cost, "CUP")}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold">Ganancia acumulada</span>
                        <span className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "font-bold tabular-nums",
                                    totals.profit >= 0
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-destructive",
                                )}
                            >
                                {formatAmount(totals.profit, "CUP")}
                            </span>
                            {totalMargin !== null && (
                                <Badge variant="secondary" className="text-xs tabular-nums">
                                    {totalMargin.toFixed(1)}%
                                </Badge>
                            )}
                        </span>
                    </div>
                </div>

                {hasConvertedRevenue && (
                    <p className="text-xs text-muted-foreground">
                        Hay ventas cobradas en otra moneda. Se convirtieron con la tasa
                        de hoy, no con la del día del cobro, que el sistema no guarda:
                        la cifra en pesos es aproximada.
                    </p>
                )}

                {unconvertedCurrencies.length > 0 && (
                    <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>
                            Hay ventas en{" "}
                            {unconvertedCurrencies.map((c) => c.toUpperCase()).join(", ")}{" "}
                            sin tipo de cambio configurado. Su ingreso no entra en las
                            cifras de arriba, así que el margen mostrado es menor que el
                            real.
                        </span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function LotRow({
    lot,
    unit,
}: {
    lot: LotProfitability;
    unit?: string | null;
}) {
    const isExhausted = lot.remainingQuantity === 0;
    // Ganancia por unidad: es lo que hace evidente que dos lotes pueden dejar lo
    // mismo por unidad y sin embargo distinto margen.
    const profitPerUnit =
        lot.soldQuantity > 0 ? lot.grossProfitBase / lot.soldQuantity : 0;

    return (
        <li className="space-y-2 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium tabular-nums">
                        Lote de {formatAmount(lot.unitCost, lot.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatDate(lot.acquiredAt)}
                        {lot.providerName ? ` · ${lot.providerName}` : ""}
                    </span>
                    {isExhausted && (
                        <Badge variant="outline" className="text-xs">
                            Agotado
                        </Badge>
                    )}
                </div>
                {lot.marginPct !== null && (
                    <Badge
                        variant="secondary"
                        className={cn(
                            "tabular-nums",
                            lot.marginPct < 0 &&
                                "border-destructive/20 bg-destructive/10 text-destructive",
                        )}
                    >
                        {lot.marginPct.toFixed(1)}% de margen
                    </Badge>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                    {formatStockWithUnit(lot.soldQuantity, unit)} vendidas
                    {lot.remainingQuantity > 0
                        ? ` · quedan ${formatStockWithUnit(lot.remainingQuantity, unit)}`
                        : ""}
                </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums">
                <span className="text-muted-foreground">
                    Ingreso{" "}
                    <span className="text-foreground">
                        {formatAmount(lot.revenueBase, "CUP")}
                    </span>
                </span>
                <span className="text-muted-foreground">
                    Costo{" "}
                    <span className="text-foreground">
                        {formatAmount(lot.costBase, "CUP")}
                    </span>
                </span>
                <span
                    className={cn(
                        "font-medium",
                        lot.grossProfitBase >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive",
                    )}
                >
                    {formatAmount(lot.grossProfitBase, "CUP")}
                    {lot.soldQuantity > 0 && (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                            ({formatAmount(profitPerUnit, "CUP")}/
                            {unit || "ud"})
                        </span>
                    )}
                </span>
            </div>
        </li>
    );
}
