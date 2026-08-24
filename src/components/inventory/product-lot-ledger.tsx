"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Layers, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatStockWithUnit } from "@/lib/units";
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
 * Compra por compra: qué costó cada lote, qué se ha recuperado de él y qué
 * queda.
 *
 * Es la lectura que no se ve afectada por reponer stock. Un lote agotado y
 * cobrado queda al 100 % para siempre, así que responde "¿cada compra se pagó
 * sola?" mientras la barra de arriba responde "¿ha vuelto el dinero puesto?".
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
    // El plegado solo entra en juego cuando la lista se hace larga: con pocos
    // lotes, esconder los agotados quitaría justo los que ya tienen historia
    // que contar.
    const collapses =
        data.lots.length > COLLAPSE_THRESHOLD && depleted.length > 0;
    const visible =
        collapses && !showDepleted
            ? data.lots.filter((l) => !l.isDepleted)
            : data.lots;

    // El primero con stock es el que alimenta la próxima venta.
    const nextLotId = data.lots.find((l) => !l.isDepleted)?.layerId ?? null;

    if (data.lots.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Layers className="size-4" aria-hidden="true" />
                        Tus lotes, compra por compra
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Este producto no tiene ninguna compra con su costo
                        registrado, así que no hay lotes que mostrar.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="size-4" aria-hidden="true" />
                    Tus lotes, compra por compra
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Cada compra es un lote con su propio costo. Las unidades salen
                    en orden de llegada.
                </p>
                <p className="mt-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                        Cada lote guarda el costo que pagaste ese día.
                    </span>{" "}
                    Si el mes que viene compras más caro, ese precio solo afecta al
                    lote nuevo: lo que ya vendiste sigue contando con el costo que
                    tuvo y su margen no vuelve a moverse. Por eso la ganancia de un
                    lote agotado es definitiva.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {spread && (
                    <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                        <TriangleAlert
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            Este producto tiene lotes a distinto costo, de{" "}
                            {formatMoney(spread.min.unitCost, spread.min.currency)}{" "}
                            a{" "}
                            {formatMoney(spread.max.unitCost, spread.max.currency)}.
                            Como las unidades salen en orden de llegada, tus
                            próximas ventas todavía se descuentan del lote más
                            antiguo y dejarán <strong>su</strong> margen, no el del
                            último precio que pagaste.
                        </span>
                    </p>
                )}

                <ul className="space-y-2">
                    {visible.map((lot) => (
                        <LotRow
                            key={lot.layerId}
                            lot={lot}
                            delta={lotCostDelta(data.lots, lot.lotNumber - 1)}
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

                <p className="text-xs text-muted-foreground">
                    El precio de venta, en cambio, es uno solo y es el de hoy. Las
                    ventas ya hechas usan lo que cobraste en cada una; lo que sigue
                    en almacén se valora al precio actual. Si cambias el precio,
                    solo cambia la parte de “lo que ganarías al vender todo”.
                </p>
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
    const soldPct =
        lot.originalQuantity > 0
            ? (lot.soldQuantity / lot.originalQuantity) * 100
            : 0;
    const isForeignCurrency = lot.currency !== "CUP";

    return (
        <li
            className={cn(
                "space-y-2 rounded-md border p-3",
                isNext && "border-primary/30 bg-primary/5",
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="tabular-nums">
                        Lote {lot.lotNumber}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {formatDateShort(lot.acquiredAt)}
                        {lot.providerName ? ` · ${lot.providerName}` : ""}
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
                </div>

                {delta !== null && delta !== 0 && (
                    <Badge
                        variant="secondary"
                        className={cn(
                            "gap-1 tabular-nums",
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
                        {Math.abs(delta).toFixed(1)}%
                    </Badge>
                )}
            </div>

            <p className="text-sm tabular-nums">
                {formatStockWithUnit(lot.originalQuantity, unit)} a{" "}
                <span className="font-medium">
                    {formatMoney(lot.unitCost, lot.currency)}
                </span>
                {isForeignCurrency && (
                    <span className="text-xs text-muted-foreground">
                        {" "}
                        ({formatMoney(lot.unitCostBase, "CUP")} por {unit || "ud"} a
                        la tasa de aquel día)
                    </span>
                )}
            </p>

            <RecoveryProgress
                segments={[
                    { pct: soldPct, className: "bg-emerald-500" },
                ]}
                label={`Vendido del lote ${lot.lotNumber}`}
                valueNow={Math.min(100, soldPct)}
                size="sm"
            />

            <p className="text-sm text-muted-foreground">
                Vendidas {formatStockWithUnit(lot.soldQuantity, unit)} de{" "}
                {formatStockWithUnit(lot.originalQuantity, unit)}
                {lot.remainingQuantity > 0
                    ? ` · quedan ${formatStockWithUnit(lot.remainingQuantity, unit)}`
                    : ""}
                {lot.writtenOffQuantity > 0
                    ? ` · ${formatStockWithUnit(lot.writtenOffQuantity, unit)} salieron sin venta`
                    : ""}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm tabular-nums">
                <span className="text-muted-foreground">
                    Invertido{" "}
                    <span className="text-foreground">
                        {money(lot.investmentBase)}
                    </span>
                </span>
                <span className="text-muted-foreground">
                    Recuperado{" "}
                    <span className="text-foreground">
                        {money(lot.revenueBase)}
                    </span>
                </span>
                {lot.pendingBase > 0 && (
                    <span className="text-muted-foreground">
                        Pendiente{" "}
                        <span className="text-foreground">
                            {money(lot.pendingBase)}
                        </span>
                    </span>
                )}
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
            </div>

            {lot.remainingQuantity > 0 && (
                <p className="text-xs text-muted-foreground">
                    Lo que te queda vale {money(lot.potentialRevenueBase)} al precio
                    de hoy.
                </p>
            )}
        </li>
    );
}
