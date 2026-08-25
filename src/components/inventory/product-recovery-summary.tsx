"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoHint } from "@/components/inventory/info-hint";
import { MarginValue, type MarginEmphasis } from "@/components/inventory/margin-value";
import { RecoveryProgress } from "@/components/inventory/recovery-progress";
import {
    buildRecoverySegments,
    negativeMarginLot,
    recoveredLots,
    recoveryPct,
    resolveVerdict,
    toDisplayCurrency,
    type RecoverySegmentKey,
} from "@/lib/product-profitability";
import { formatMoney, type ExchangeRateLike } from "@/lib/currency";
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
    collected: { label: "Cobrado", bar: "bg-emerald-500", dot: "bg-emerald-500" },
    billed: {
        label: "Sin cobrar",
        bar: "bg-emerald-500/40",
        dot: "bg-emerald-500/40",
    },
    stock: {
        label: "Mercancía",
        bar: "bg-emerald-500/15",
        dot: "bg-emerald-500/15 border border-emerald-500/40",
    },
    uncovered: {
        label: "Sin cubrir",
        bar: "bg-destructive/70",
        dot: "bg-destructive/70",
    },
};

/** Lo que se lee bajo el número grande. Nunca más de seis palabras. */
const VERDICT_CAPTION: Record<ReturnType<typeof resolveVerdict>, string> = {
    "sin-compras": "sin compras registradas",
    "sin-ventas": "todo sigue en el almacén",
    recuperado: "ya recuperaste la inversión",
    "en-riesgo": "y hay dinero que no volverá",
    "en-camino": "de tu inversión recuperada",
};

/**
 * En qué punto está el producto.
 *
 * Una sola cifra manda y el resto la acompaña. La versión anterior daba el
 * mismo peso visual a cuatro importes, tres avisos y dos párrafos didácticos:
 * había que leerla entera para saber algo que cabe en un número.
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
    const pct = recoveryPct(data) ?? 0;
    const lots = recoveredLots(data.lots);
    const verdict = resolveVerdict(data);
    const uncovered = segments.find((s) => s.key === "uncovered");
    const enPerdida = negativeMarginLot(data);

    const toneClass =
        verdict === "en-riesgo"
            ? "text-destructive"
            : verdict === "recuperado"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground";

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                    ¿En qué punto estás?
                    <InfoHint label="la recuperación de la inversión">
                        <p>
                            La barra reparte <strong>todo lo que has pagado</strong>{" "}
                            por este producto: lo que ya cobraste, lo vendido que
                            aún te deben, lo que sigue siendo mercancía en el
                            almacén y —solo si lo hay— lo que ya no vas a recuperar.
                        </p>
                        <p>
                            Cada compra nueva sube la meta, porque es dinero que
                            acabas de poner. Por eso el porcentaje puede bajar
                            aunque el negocio vaya bien. Para saber si cada compra
                            se pagó sola, mira los lotes: esos ya no cambian.
                        </p>
                        <p>
                            «Pendiente» no es una deuda: casi todo suele ser
                            mercancía sin vender.
                        </p>
                    </InfoHint>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="text-center">
                    <p
                        className={cn(
                            "text-5xl font-bold tabular-nums",
                            toneClass,
                        )}
                    >
                        {pct.toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {VERDICT_CAPTION[verdict]}
                    </p>
                </div>

                <div className="space-y-2">
                    <RecoveryProgress
                        segments={segments.map((s) => ({
                            pct: s.pct,
                            className: SEGMENT_STYLE[s.key].bar,
                        }))}
                        label="Recuperación de la inversión"
                        valueNow={Math.min(100, pct)}
                    />

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {segments
                            .filter((s) => s.amountBase > 0)
                            .map((s) => (
                                <Tooltip key={s.key}>
                                    <TooltipTrigger asChild>
                                        <span className="flex cursor-help items-center gap-1.5">
                                            <span
                                                className={cn(
                                                    "size-2 shrink-0 rounded-full",
                                                    SEGMENT_STYLE[s.key].dot,
                                                )}
                                                aria-hidden="true"
                                            />
                                            {SEGMENT_STYLE[s.key].label}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="tabular-nums">
                                        {money(s.amountBase)}
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        {lots.total > 0 && (
                            <span className="ml-auto tabular-nums">
                                {lots.recovered} de {lots.total} lotes recuperados
                            </span>
                        )}
                    </div>
                </div>

                {data.potential.unitsToBreakEven !== null &&
                    data.potential.unitsToBreakEven > 0 && (
                        <p className="text-center text-sm">
                            Faltan{" "}
                            <span className="font-semibold">
                                {formatStockWithUnit(
                                    data.potential.unitsToBreakEven,
                                    unit,
                                )}
                            </span>{" "}
                            por vender
                            {!data.potential.coverableWithStock && (
                                <span className="text-muted-foreground">
                                    , más de lo que tienes
                                </span>
                            )}
                        </p>
                    )}

                <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
                    <Figure
                        label="Invertido"
                        value={money(data.investment.totalBase)}
                        hint="Todo lo que has pagado por este producto desde la primera compra."
                        warning={
                            data.investment.uncostedQuantity > 0
                                ? `Hay ${formatStockWithUnit(data.investment.uncostedQuantity, unit)} sin costo registrado: lo invertido real es mayor.`
                                : undefined
                        }
                    />
                    <Figure
                        label="Recuperado"
                        value={money(data.recovery.revenueBase)}
                        hint={`Lo vendido, esté cobrado o no. Cobrado de verdad: ${money(data.recovery.collectedBase)}.`}
                    />
                    <Figure
                        label={
                            data.recovery.pendingBase > 0 ? "Pendiente" : "De más"
                        }
                        value={money(
                            data.recovery.pendingBase > 0
                                ? data.recovery.pendingBase
                                : data.recovery.revenueBase -
                                      data.investment.totalBase,
                        )}
                        hint="No es una pérdida: la mayor parte suele estar todavía en el almacén, en mercancía sin vender."
                    />
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Ganancia</p>
                        <MarginValue
                            amount={toDisplayCurrency(
                                data.recovery.profitBase,
                                currency,
                                exchangeRate,
                            )}
                            marginPct={data.recovery.marginPct}
                            currency={currency}
                            emphasis={emphasis}
                        />
                    </div>
                </div>

                {data.effectivePrice > 0 && (
                    <p className="flex flex-wrap items-baseline gap-x-1.5 border-t pt-4 text-sm text-muted-foreground">
                        <span>Si vendes todo lo que queda cobrarías</span>
                        <span className="font-semibold tabular-nums text-foreground">
                            {money(data.potential.revenueBase)}
                        </span>
                        <span>y ganarías</span>
                        <MarginValue
                            amount={toDisplayCurrency(
                                data.potential.profitBase,
                                currency,
                                exchangeRate,
                            )}
                            marginPct={data.potential.marginPct}
                            currency={currency}
                            emphasis={emphasis}
                        />
                        <InfoHint label="la proyección del stock">
                            <p>
                                Es una <strong>proyección</strong>, no dinero que
                                exista: da por hecho que vendes todo el stock al
                                precio de hoy
                                {data.isOnOffer
                                    ? ", que es el de la oferta vigente"
                                    : ""}
                                , sin mermas ni descuentos, y al precio de venta al
                                detalle.
                            </p>
                            {data.investment.uncostedQuantity > 0 && (
                                <p>
                                    Además,{" "}
                                    {formatStockWithUnit(
                                        data.investment.uncostedQuantity,
                                        unit,
                                    )}{" "}
                                    del stock no tienen costo registrado: cobrarías
                                    por ellas, pero no entran en el margen, así que
                                    la ganancia sale más optimista que la real.
                                </p>
                            )}
                        </InfoHint>
                    </p>
                )}

                {enPerdida && (
                    <Notice tone="danger">
                        Estás vendiendo por debajo del costo: el lote{" "}
                        {enPerdida.lotNumber} costó{" "}
                        {money(enPerdida.unitCostBase)} y vendes a{" "}
                        {money(data.effectivePrice)}.
                    </Notice>
                )}

                {uncovered && uncovered.amountBase > 0 && (
                    <Notice tone="danger">
                        {money(uncovered.amountBase)} no se van a recuperar con el
                        stock que queda.
                    </Notice>
                )}

                {data.unconvertedCurrencies.length > 0 && (
                    <Notice tone="warning">
                        Hay ventas en{" "}
                        {data.unconvertedCurrencies
                            .map((c) => c.toUpperCase())
                            .join(", ")}{" "}
                        sin tasa configurada: lo pendiente que ves es mayor que el
                        real.
                    </Notice>
                )}

                {data.hasConvertedRevenue && (
                    <p className="text-xs text-muted-foreground">
                        Hay ventas en otra moneda, convertidas con la tasa de hoy:
                        lo recuperado es aproximado.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

/** Una cifra con su etiqueta corta; la explicación va detrás del texto. */
function Figure({
    label,
    value,
    hint,
    warning,
}: {
    label: string;
    value: string;
    hint: string;
    warning?: string;
}) {
    return (
        <div className="space-y-1">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="cursor-help">{label}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">{hint}</TooltipContent>
                </Tooltip>
                {warning && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <TriangleAlert
                                className="size-3 shrink-0 cursor-help text-amber-600 dark:text-amber-400"
                                aria-label="Aviso sobre esta cifra"
                            />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            {warning}
                        </TooltipContent>
                    </Tooltip>
                )}
            </p>
            <p className="text-lg font-semibold tabular-nums">{value}</p>
        </div>
    );
}

/** Aviso de una línea. Lo que antes era un párrafo con icono y fondo. */
function Notice({
    tone,
    children,
}: {
    tone: "danger" | "warning";
    children: React.ReactNode;
}) {
    return (
        <p
            className={cn(
                "flex items-start gap-2 rounded-md p-2.5 text-sm",
                tone === "danger"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
        >
            <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
            />
            <span>{children}</span>
        </p>
    );
}
