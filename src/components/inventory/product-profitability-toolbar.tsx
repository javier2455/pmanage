"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BusinessProductCombobox } from "@/components/inventory/business-product-combobox";
import type { MarginEmphasis } from "@/components/inventory/margin-value";
import {
    BASE_CURRENCY,
    currencyLabel,
    getCurrencyRate,
    type ExchangeRateLike,
} from "@/lib/currency";
import type { BusinessWithProducts } from "@/lib/types/business";
import { cn } from "@/lib/utils";

interface ProductProfitabilityToolbarProps {
    businessId: string;
    selectedProduct: BusinessWithProducts | null;
    onProductChange: (product: BusinessWithProducts | null) => void;
    currency: string;
    onCurrencyChange: (currency: string) => void;
    availableCurrencies: string[];
    exchangeRate: ExchangeRateLike;
    emphasis: MarginEmphasis;
    onEmphasisChange: (emphasis: MarginEmphasis) => void;
}

/**
 * Selección de producto y forma de leer las cifras.
 *
 * La moneda y el conmutador solo aparecen con un producto elegido: antes de eso
 * no gobiernan nada y solo serían ruido.
 */
export function ProductProfitabilityToolbar({
    businessId,
    selectedProduct,
    onProductChange,
    currency,
    onCurrencyChange,
    availableCurrencies,
    exchangeRate,
    emphasis,
    onEmphasisChange,
}: ProductProfitabilityToolbarProps) {
    const rate = getCurrencyRate(exchangeRate, currency);
    const showCurrencySelect =
        !!selectedProduct && availableCurrencies.length > 1;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <BusinessProductCombobox
                    businessId={businessId}
                    value={selectedProduct}
                    onValueChange={onProductChange}
                    id="product-profitability-product"
                    label="Producto"
                    className="flex-1"
                />

                {selectedProduct && (
                    <div className="flex items-center gap-2">
                        {showCurrencySelect && (
                            <Select
                                value={currency}
                                onValueChange={onCurrencyChange}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="w-auto min-w-32"
                                    aria-label="Moneda de las cifras"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCurrencies.map((code) => (
                                        <SelectItem key={code} value={code}>
                                            {currencyLabel(code)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <div className="inline-flex items-center rounded-md border border-border p-0.5">
                            <Button
                                size="sm"
                                variant={
                                    emphasis === "money" ? "secondary" : "ghost"
                                }
                                aria-pressed={emphasis === "money"}
                                aria-label="Ver los márgenes en dinero"
                                onClick={() => onEmphasisChange("money")}
                                className={cn("px-3")}
                            >
                                $
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    emphasis === "percent" ? "secondary" : "ghost"
                                }
                                aria-pressed={emphasis === "percent"}
                                aria-label="Ver los márgenes en porcentaje"
                                onClick={() => onEmphasisChange("percent")}
                                className={cn("px-3")}
                            >
                                %
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {selectedProduct && currency !== BASE_CURRENCY && rate !== null && (
                <p className="text-xs text-muted-foreground">
                    Cifras convertidas a {currencyLabel(currency)} con la tasa de
                    hoy (1 {currency} = {rate} CUP). Es una equivalencia para
                    orientarte, no lo que cobraste o pagaste de verdad: cada compra
                    y cada venta se hizo con la tasa de su día.
                </p>
            )}
        </div>
    );
}
