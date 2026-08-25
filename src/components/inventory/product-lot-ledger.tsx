"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/inventory/info-hint";
import { MarginValue, type MarginEmphasis } from "@/components/inventory/margin-value";
import { RecoveryProgress } from "@/components/inventory/recovery-progress";
import {
    liveCostSpread,
    lotCostDelta,
    toDisplayCurrency,
} from "@/lib/product-profitability";
import { formatMoney, type ExchangeRateLike } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";
import type {
    LotInvestmentStatus,
    ProductInvestmentStatusData,
} from "@/lib/types/inventory";
import { formatQuantity, formatStockWithUnit } from "@/lib/units";
import { cn } from "@/lib/utils";

/** A partir de aquí, los lotes agotados se pliegan para no tapar los vivos. */
const COLLAPSE_THRESHOLD = 8;

interface ProductLotLedgerProps {
    data: ProductInvestmentStatusData;
    currency: string;
    exchangeRate: ExchangeRateLike;
    emphasis: MarginEmphasis;
    unit?: string | null;
    className?: string;
}

/**
 * Compra por compra: qué costó cada lote y cuánto se ha recuperado de él.
 *
 * Cada lote entra en una línea y el detalle en dinero se despliega al pulsar.
 * Antes ocupaba seis líneas, así que dos lotes ya llenaban la pantalla y había
 * que hacer scroll para lo único que se compara de verdad: cuánto queda de cada
 * compra y a qué costo entró.
 */
export function ProductLotLedger({
    data,
    currency,
    exchangeRate,
    emphasis,
    unit,
    className,
}: ProductLotLedgerProps) {
    const [showDepleted, setShowDepleted] = React.useState(false);

    const money = React.useCallback(
        (amountBase: number) =>
            formatMoney(
                toDisplayCurrency(amountBase, currency, exchangeRate),
                currency,
            ),
        [currency, exchangeRate],
    );

    const spread = liveCostSpread(data.lots);
    const depleted = data.lots.filter((l) => l.isDepleted);
    const collapses =
        data.lots.length > COLLAPSE_THRESHOLD && depleted.length > 0;
    const visible =
        collapses && !showDepleted
            ? data.lots.filter((l) => !l.isDepleted)
            : data.lots;

    // El primero con stock es el que alimenta la próxima venta.
    const nextLotId = data.lots.find((l) => !l.isDepleted)?.layerId ?? null;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                    Tus lotes, compra por compra
                    <InfoHint label="los lotes">
                        <p>
                            Cada compra es un lote con{" "}
                            <strong>el costo que pagaste ese día</strong>. Las
                            unidades salen en orden de llegada, así que el lote más
                            antiguo surte las próximas ventas.
                        </p>
                        <p>
                            Si mañana compras más caro, ese precio solo afecta al
                            lote nuevo: lo que ya vendiste conserva su costo y su
                            margen no vuelve a moverse. Por eso la ganancia de un
                            lote agotado es definitiva.
                        </p>
                        <p>
                            El precio de venta, en cambio, es uno solo y es el de
                            hoy. Cambiarlo solo mueve la proyección de lo que
                            ganarías con el stock que queda.
                        </p>
                    </InfoHint>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {data.lots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Este producto no tiene ninguna compra con su costo
                        registrado.
                    </p>
                ) : (
                    <>
                        {spread && (
                            <p className="text-xs text-muted-foreground">
                                Tienes lotes de{" "}
                                <span className="tabular-nums">
                                    {formatMoney(
                                        spread.min.unitCost,
                                        spread.min.currency,
                                    )}
                                </span>{" "}
                                a{" "}
                                <span className="tabular-nums">
                                    {formatMoney(
                                        spread.max.unitCost,
                                        spread.max.currency,
                                    )}
                                </span>
                                : las próximas ventas salen del más antiguo y dejan{" "}
                                <strong>su</strong> margen.
                            </p>
                        )}

                        <ul className="divide-y rounded-md border">
                            {visible.map((lot) => (
                                <LotRow
                                    key={lot.layerId}
                                    lot={lot}
                                    delta={lotCostDelta(
                                        data.lots,
                                        lot.lotNumber - 1,
                                    )}
                                    isNext={lot.layerId === nextLotId}
                                    money={money}
                                    currency={currency}
                                    exchangeRate={exchangeRate}
                                    emphasis={emphasis}
                                    unit={unit}
                                />
                            ))}
                        </ul>

                        {collapses && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDepleted((v) => !v)}
                            >
                                {showDepleted
                                    ? "Ocultar los lotes agotados"
                                    : `Ver los ${depleted.length} lotes agotados`}
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function LotRow({
    lot,
    delta,
    isNext,
    money,
    currency,
    exchangeRate,
    emphasis,
    unit,
}: {
    lot: LotInvestmentStatus;
    delta: number | null;
    isNext: boolean;
    money: (amountBase: number) => string;
    currency: string;
    exchangeRate: ExchangeRateLike;
    emphasis: MarginEmphasis;
    unit?: string | null;
}) {
    const [open, setOpen] = React.useState(false);

    const soldPct =
        lot.originalQuantity > 0
            ? (lot.soldQuantity / lot.originalQuantity) * 100
            : 0;

    return (
        <li className={cn(isNext && "bg-primary/5")}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 p-3 text-left text-sm transition-colors hover:bg-muted/50"
            >
                <span className="font-medium tabular-nums">
                    Lote {lot.lotNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                    {formatDateShort(lot.acquiredAt)}
                </span>
                <span className="tabular-nums">
                    {formatMoney(lot.unitCost, lot.currency)}
                </span>

                {delta !== null && delta !== 0 && (
                    <span
                        className={cn(
                            "flex items-center gap-0.5 text-xs tabular-nums",
                            delta > 0
                                ? "text-destructive"
                                : "text-emerald-600 dark:text-emerald-400",
                        )}
                        title="Variación del costo respecto al lote anterior"
                    >
                        {delta > 0 ? (
                            <ArrowUp className="size-3" aria-hidden="true" />
                        ) : (
                            <ArrowDown className="size-3" aria-hidden="true" />
                        )}
                        {Math.abs(delta).toFixed(0)}%
                    </span>
                )}

                <RecoveryProgress
                    segments={[{ pct: soldPct, className: "bg-emerald-500" }]}
                    label={`Vendido del lote ${lot.lotNumber}`}
                    valueNow={Math.min(100, soldPct)}
                    size="sm"
                    className="w-20 shrink-0"
                />

                <span className="tabular-nums text-muted-foreground">
                    {formatQuantity(lot.soldQuantity, unit)}/
                    {formatQuantity(lot.originalQuantity, unit)}
                </span>

                {isNext && (
                    <Badge variant="secondary" className="text-xs">
                        Sale primero
                    </Badge>
                )}
                {lot.isDepleted && (
                    <Badge variant="outline" className="text-xs">
                        Agotado
                    </Badge>
                )}

                <span className="ml-auto flex items-center gap-2">
                    <MarginValue
                        amount={toDisplayCurrency(
                            lot.profitBase,
                            currency,
                            exchangeRate,
                        )}
                        marginPct={lot.marginPct}
                        currency={currency}
                        emphasis={emphasis}
                    />
                    <ChevronDown
                        className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-transform",
                            open && "rotate-180",
                        )}
                        aria-hidden="true"
                    />
                </span>
            </button>

            {open && (
                <div className="space-y-1 px-3 pb-3 text-sm text-muted-foreground">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
                        <span>
                            Invertido{" "}
                            <span className="text-foreground">
                                {money(lot.investmentBase)}
                            </span>
                        </span>
                        <span>
                            Recuperado{" "}
                            <span className="text-foreground">
                                {money(lot.revenueBase)}
                            </span>
                        </span>
                        {lot.pendingBase > 0 && (
                            <span>
                                Pendiente{" "}
                                <span className="text-foreground">
                                    {money(lot.pendingBase)}
                                </span>
                            </span>
                        )}
                    </div>

                    <p>
                        {lot.remainingQuantity > 0
                            ? `Quedan ${formatStockWithUnit(lot.remainingQuantity, unit)}, que valen ${money(lot.potentialRevenueBase)} al precio de hoy.`
                            : "Lote agotado: su ganancia ya es definitiva."}
                        {lot.writtenOffQuantity > 0 &&
                            ` ${formatStockWithUnit(lot.writtenOffQuantity, unit)} salieron sin venta.`}
                    </p>

                    {lot.providerName && <p>Proveedor: {lot.providerName}.</p>}

                    {lot.currency !== "CUP" && (
                        <p className="tabular-nums">
                            {formatMoney(lot.unitCostBase, "CUP")} por{" "}
                            {unit || "ud"} a la tasa del día de la compra.
                        </p>
                    )}
                </div>
            )}
        </li>
    );
}
