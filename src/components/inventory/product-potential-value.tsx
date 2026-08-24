"use client";

import { TrendingUp, TriangleAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarginValue, type MarginEmphasis } from "@/components/inventory/margin-value";
import {
    negativeMarginLot,
    toDisplayCurrency,
} from "@/lib/product-profitability";
import { formatMoney, type ExchangeRateLike } from "@/lib/currency";
import type { ProductInvestmentStatusData } from "@/lib/types/inventory";
import { formatStockWithUnit } from "@/lib/units";

interface ProductPotentialValueProps {
    data: ProductInvestmentStatusData;
    currency: string;
    exchangeRate: ExchangeRateLike;
    emphasis: MarginEmphasis;
    unit?: string | null;
    className?: string;
}

/**
 * Lo que dejaría vender todo el stock que queda, al precio de hoy.
 *
 * Se presenta como proyección y no como ganancia: da por hecho que se vende
 * todo, sin mermas ni descuentos, y al precio minorista. Es útil para decidir
 * —¿me compensa liquidar esto?— pero no es dinero que exista.
 */
export function ProductPotentialValue({
    data,
    currency,
    exchangeRate,
    emphasis,
    unit,
    className,
}: ProductPotentialValueProps) {
    const money = (amountBase: number) =>
        formatMoney(
            toDisplayCurrency(amountBase, currency, exchangeRate),
            currency,
        );

    const enPerdida = negativeMarginLot(data);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="size-4" aria-hidden="true" />
                    Si vendes todo lo que te queda
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Una proyección al precio de hoy
                    {data.isOnOffer ? ", que es el de la oferta vigente" : ""}. No
                    cuenta mermas ni descuentos.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {data.effectivePrice <= 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Este producto no tiene precio de venta configurado, así que
                        no podemos calcular lo que ganarías al vender lo que te
                        queda.
                    </p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Cobrarías
                            </p>
                            <p className="text-2xl font-bold tabular-nums">
                                {money(data.potential.revenueBase)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatStockWithUnit(data.stockQuantity, unit)} a{" "}
                                {money(data.effectivePrice)}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Te quedarían
                            </p>
                            <MarginValue
                                amount={toDisplayCurrency(
                                    data.potential.profitBase,
                                    currency,
                                    exchangeRate,
                                )}
                                marginPct={data.potential.marginPct}
                                currency={currency}
                                emphasis={emphasis}
                                size="kpi"
                            />
                            <p className="text-xs text-muted-foreground">
                                Descontando los {money(data.investment.liveBase)}{" "}
                                que costó el stock
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                Ganancia total del producto
                            </p>
                            <p className="text-2xl font-bold tabular-nums">
                                {money(data.potential.totalProfitIfSoldOutBase)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Lo ya ganado más lo que dejaría el stock
                            </p>
                        </div>
                    </div>
                )}

                {enPerdida && (
                    <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        <TriangleAlert
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>
                            Estás vendiendo por debajo de lo que te costó. El lote{" "}
                            {enPerdida.lotNumber}, que es el que surte las próximas
                            ventas, costó {money(enPerdida.unitCostBase)} por unidad
                            y el precio actual es {money(data.effectivePrice)}: cada
                            unidad que salga deja pérdida.
                        </span>
                    </p>
                )}

                {data.investment.uncostedQuantity > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {formatStockWithUnit(
                            data.investment.uncostedQuantity,
                            unit,
                        )}{" "}
                        del stock no tienen costo registrado. Cobrarías por ellas,
                        pero no entran en el margen: la ganancia mostrada es más
                        optimista que la real.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
