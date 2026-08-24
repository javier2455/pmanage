"use client";

import * as React from "react";
import { Target, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarginValue, type MarginEmphasis } from "@/components/inventory/margin-value";
import { RecoveryProgress } from "@/components/inventory/recovery-progress";
import {
    buildRecoverySegments,
    excessPct,
    recoveredLots,
    recoveryPct,
    resolveVerdict,
    toDisplayCurrency,
    type RecoverySegmentKey,
} from "@/lib/product-profitability";
import type { ExchangeRateLike } from "@/lib/currency";
import { formatMoney } from "@/lib/currency";
import type { ProductInvestmentStatusData } from "@/lib/types/inventory";
import { formatStockWithUnit } from "@/lib/units";
import { cn } from "@/lib/utils";

interface ProductRecoverySummaryProps {
    data: ProductInvestmentStatusData;
    currency: string;
    exchangeRate: ExchangeRateLike;
    emphasis: MarginEmphasis;
    unit?: string | null;
    className?: string;
}

const SEGMENT_STYLE: Record<
    RecoverySegmentKey,
    { label: string; bar: string; dot: string }
> = {
    collected: {
        label: "Cobrado",
        bar: "bg-emerald-500",
        dot: "bg-emerald-500",
    },
    billed: {
        label: "Vendido, sin cobrar",
        bar: "bg-emerald-500/40",
        dot: "bg-emerald-500/40",
    },
    stock: {
        label: "En mercancía",
        bar: "bg-emerald-500/15",
        dot: "bg-emerald-500/15 border border-emerald-500/40",
    },
    uncovered: {
        label: "Sin cubrir",
        bar: "bg-destructive/70",
        dot: "bg-destructive/70",
    },
};

/**
 * En qué punto está el producto: lo puesto, lo que ha vuelto y lo que falta.
 *
 * Es la tarjeta que responde la pregunta de la pantalla, así que va primero y
 * a ancho completo. La barra reparte lo invertido en cuatro tramos en vez de
 * medir "recuperado sobre invertido", porque esa lectura retrocede cada vez
 * que el dueño repone stock aunque el negocio vaya bien.
 */
export function ProductRecoverySummary({
    data,
    currency,
    exchangeRate,
    emphasis,
    unit,
    className,
}: ProductRecoverySummaryProps) {
    const money = React.useCallback(
        (amountBase: number) =>
            formatMoney(
                toDisplayCurrency(amountBase, currency, exchangeRate),
                currency,
            ),
        [currency, exchangeRate],
    );

    const segments = buildRecoverySegments(data);
    const pct = recoveryPct(data);
    const excess = excessPct(data);
    const lots = recoveredLots(data.lots);
    const verdict = resolveVerdict(data);
    const uncovered = segments.find((s) => s.key === "uncovered");

    const verdictText = resolveVerdictText({
        verdict,
        data,
        money,
        unit,
        pct,
        excess,
    });

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="size-4" aria-hidden="true" />
                    ¿En qué punto estás?
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                <p className="text-base text-foreground">{verdictText}</p>

                <div className="space-y-3">
                    <RecoveryProgress
                        segments={segments.map((s) => ({
                            pct: s.pct,
                            className: SEGMENT_STYLE[s.key].bar,
                        }))}
                        label="Recuperación de la inversión"
                        valueNow={Math.min(100, pct ?? 0)}
                    />

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        {segments
                            .filter((s) => s.amountBase > 0)
                            .map((s) => (
                                <span
                                    key={s.key}
                                    className="flex items-center gap-1.5 text-muted-foreground"
                                >
                                    <span
                                        className={cn(
                                            "size-2 shrink-0 rounded-full",
                                            SEGMENT_STYLE[s.key].dot,
                                        )}
                                        aria-hidden="true"
                                    />
                                    {SEGMENT_STYLE[s.key].label}{" "}
                                    <span className="tabular-nums text-foreground">
                                        {money(s.amountBase)}
                                    </span>
                                </span>
                            ))}
                        {excess > 0 && (
                            <Badge
                                variant="secondary"
                                className="tabular-nums text-emerald-700 dark:text-emerald-400"
                            >
                                +{excess.toFixed(1)}% de más
                            </Badge>
                        )}
                    </div>

                    {data.potential.unitsToBreakEven !== null &&
                        data.potential.unitsToBreakEven > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Te faltan{" "}
                                <span className="font-medium text-foreground">
                                    {formatStockWithUnit(
                                        data.potential.unitsToBreakEven,
                                        unit,
                                    )}
                                </span>{" "}
                                por vender al precio de hoy para recuperar la
                                inversión
                                {!data.potential.coverableWithStock &&
                                    ", más de lo que tienes en almacén"}
                                .
                            </p>
                        )}

                    {lots.total > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Lotes ya recuperados: {lots.recovered} de {lots.total}.
                            Cada compra nueva sube la meta, porque es dinero que
                            acabas de poner. Si quieres saber si cada compra se pagó
                            sola, mira los lotes de abajo: esos ya no cambian.
                        </p>
                    )}
                </div>

                <div className="grid gap-4 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Kpi
                        label="Total invertido"
                        value={money(data.investment.totalBase)}
                        tooltip="Todo lo que has pagado por este producto desde la primera compra, al costo de cada lote."
                        warning={
                            data.investment.uncostedQuantity > 0
                                ? `Hay ${formatStockWithUnit(data.investment.uncostedQuantity, unit)} en stock sin costo registrado, así que la inversión real es mayor que la mostrada.`
                                : undefined
                        }
                    />
                    <Kpi
                        label="Recuperado con ventas"
                        value={money(data.recovery.revenueBase)}
                        tooltip="Cuenta lo vendido, esté cobrado o no. Debajo, lo que de eso ya está en caja."
                        footnote={`Cobrado: ${money(data.recovery.collectedBase)}`}
                    />
                    <Kpi
                        label={
                            data.recovery.pendingBase > 0
                                ? "Pendiente por recuperar"
                                : "Recuperado de más"
                        }
                        value={
                            data.recovery.pendingBase > 0
                                ? money(data.recovery.pendingBase)
                                : money(
                                      data.recovery.revenueBase -
                                          data.investment.totalBase,
                                  )
                        }
                        tooltip="No es una pérdida: la mayor parte suele estar todavía en el almacén, en mercancía sin vender."
                    />
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Ganancia realizada
                        </p>
                        <MarginValue
                            amount={toDisplayCurrency(
                                data.recovery.profitBase,
                                currency,
                                exchangeRate,
                            )}
                            marginPct={data.recovery.marginPct}
                            currency={currency}
                            emphasis={emphasis}
                            size="kpi"
                        />
                    </div>
                </div>

                {uncovered && uncovered.amountBase > 0 && (
                    <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        <TriangleAlert
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            Hay {money(uncovered.amountBase)} que ya no vas a
                            recuperar con el stock que queda: salieron unidades por
                            debajo de lo que costaron, o se perdieron en un ajuste
                            de inventario.
                        </span>
                    </p>
                )}

                {data.unconvertedCurrencies.length > 0 && (
                    <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                        <TriangleAlert
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            Hay ventas en{" "}
                            {data.unconvertedCurrencies
                                .map((c) => c.toUpperCase())
                                .join(", ")}{" "}
                            sin tipo de cambio configurado. Su ingreso no entra en
                            lo recuperado, así que lo pendiente que ves es mayor que
                            el real.
                        </span>
                    </p>
                )}

                {data.hasConvertedRevenue && (
                    <p className="text-xs text-muted-foreground">
                        Hay ventas cobradas en otra moneda. Se convirtieron con la
                        tasa de hoy, no con la del día del cobro, que el sistema no
                        guarda: lo recuperado es aproximado.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function Kpi({
    label,
    value,
    tooltip,
    footnote,
    warning,
}: {
    label: string;
    value: string;
    tooltip: string;
    footnote?: string;
    warning?: string;
}) {
    return (
        <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-help">{label}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
                </Tooltip>
                {warning && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TriangleAlert
                                className="size-3.5 shrink-0 cursor-help text-amber-600 dark:text-amber-400"
                                aria-label="Aviso sobre esta cifra"
                            />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            {warning}
                        </TooltipContent>
                    </Tooltip>
                )}
            </p>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            {footnote && (
                <p className="text-xs tabular-nums text-muted-foreground">
                    {footnote}
                </p>
            )}
        </div>
    );
}

/** La frase de arriba del todo. Es el resumen que el dueño lee primero. */
function resolveVerdictText({
    verdict,
    data,
    money,
    unit,
    pct,
    excess,
}: {
    verdict: ReturnType<typeof resolveVerdict>;
    data: ProductInvestmentStatusData;
    money: (amountBase: number) => string;
    unit?: string | null;
    pct: number | null;
    excess: number;
}): string {
    const stock = formatStockWithUnit(data.stockQuantity, unit);

    switch (verdict) {
        case "sin-compras":
            return "Todavía no has registrado ninguna entrada de este producto, así que no hay inversión que recuperar.";
        case "sin-ventas":
            return `Todavía no has vendido nada. Tienes ${stock} en almacén que te costaron ${money(data.investment.liveBase)}; al precio de hoy, venderlo todo te devolvería ${money(data.potential.revenueBase)}.`;
        case "recuperado":
            return `Ya recuperaste todo lo que invertiste, y un ${excess.toFixed(1)} % por encima. Además te quedan ${stock} en almacén, valorados en ${money(data.investment.liveBase)} a costo.`;
        case "en-riesgo":
            return "Has vendido por debajo de lo que te costó la mercancía: hay dinero que ya no vas a recuperar con el stock que te queda.";
        default:
            return `Llevas recuperado el ${(pct ?? 0).toFixed(1)} % de lo que invertiste. Te faltan ${money(data.recovery.pendingBase)} y todavía tienes mercancía por ${money(data.investment.liveBase)} a costo para cubrirlo.`;
    }
}
