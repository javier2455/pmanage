"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, PackageSearch, Plus, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProductLotLedger } from "@/components/inventory/product-lot-ledger";
import { ProductPotentialValue } from "@/components/inventory/product-potential-value";
import { ProductProfitabilityToolbar } from "@/components/inventory/product-profitability-toolbar";
import { ProductRecoverySummary } from "@/components/inventory/product-recovery-summary";
import type { MarginEmphasis } from "@/components/inventory/margin-value";
import { useBusiness } from "@/context/business-context";
import { useExchangeRate } from "@/hooks/use-exchange";
import { useProductInvestmentStatus } from "@/hooks/use-inventory";
import { BASE_CURRENCY, getAvailableCurrencies } from "@/lib/currency";
import type { BusinessWithProducts } from "@/lib/types/business";

/**
 * Rentabilidad de un producto: cuánto se puso, cuánto ha vuelto y qué queda por
 * ganar.
 *
 * Las tarjetas de costeo del historial responden a trozos —qué hay en el
 * almacén, qué margen dejó cada compra— pero ninguna cruza el desembolso
 * acumulado con lo cobrado, que es la pregunta que un dueño se hace de verdad:
 * "¿esto ya se pagó solo?".
 */
export default function ProductProfitabilityPage() {
    const { activeBusinessId } = useBusiness();
    const businessId = activeBusinessId ?? "";

    const [selectedProduct, setSelectedProduct] =
        React.useState<BusinessWithProducts | null>(null);
    const [currency, setCurrency] = React.useState<string>(BASE_CURRENCY);
    const [emphasis, setEmphasis] = React.useState<MarginEmphasis>("money");

    const productId = selectedProduct?.product.id ?? "";
    const { data, isLoading, isError, refetch } = useProductInvestmentStatus(
        businessId,
        productId,
    );

    const { data: exchangeData } = useExchangeRate(businessId);
    const exchangeRate = exchangeData?.data;
    const availableCurrencies = React.useMemo(
        () => getAvailableCurrencies(exchangeRate),
        [exchangeRate],
    );

    // Si la moneda elegida deja de tener tasa configurada, la vista mostraría
    // importes sin convertir bajo una etiqueta que promete otra cosa.
    React.useEffect(() => {
        if (!availableCurrencies.includes(currency)) {
            setCurrency(BASE_CURRENCY);
        }
    }, [availableCurrencies, currency]);

    return (
        <TooltipProvider>
            <section className="flex flex-col gap-6">
                <div className="mb-4 flex items-center gap-4">
                    <Link
                        href="/dashboard/business/inventory"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Rentabilidad del producto
                        </h1>
                        <p className="text-muted-foreground">
                            Cuánto llevas invertido en un producto, cuánto has
                            recuperado y qué te queda por ganar.
                        </p>
                    </div>
                </div>

                <ProductProfitabilityToolbar
                    businessId={businessId}
                    selectedProduct={selectedProduct}
                    onProductChange={setSelectedProduct}
                    currency={currency}
                    onCurrencyChange={setCurrency}
                    availableCurrencies={availableCurrencies}
                    exchangeRate={exchangeRate}
                    emphasis={emphasis}
                    onEmphasisChange={setEmphasis}
                />

                {!businessId && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <PackageSearch />
                            </EmptyMedia>
                            <EmptyTitle>Selecciona un negocio</EmptyTitle>
                            <EmptyDescription>
                                Elige un negocio para ver la rentabilidad de sus
                                productos.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}

                {businessId && !selectedProduct && (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <PackageSearch />
                            </EmptyMedia>
                            <EmptyTitle>Elige un producto</EmptyTitle>
                            <EmptyDescription>
                                Escribe su nombre y te decimos cuánto llevas
                                invertido, cuánto has recuperado y qué ganarías
                                vendiendo lo que te queda.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}

                {selectedProduct && isLoading && (
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-56 w-full" />
                    </div>
                )}

                {selectedProduct && !isLoading && (isError || !data?.data) && (
                    <Card>
                        <CardContent className="flex flex-col items-start gap-3 py-6">
                            <p className="flex items-start gap-2 text-sm text-muted-foreground">
                                <TriangleAlert
                                    className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                                    aria-hidden="true"
                                />
                                No se pudo calcular la rentabilidad de este
                                producto.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                            >
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {selectedProduct &&
                    !isLoading &&
                    data?.data &&
                    (data.data.investment.totalBase <= 0 &&
                    data.data.lots.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    <Plus />
                                </EmptyMedia>
                                <EmptyTitle>Sin entradas registradas</EmptyTitle>
                                <EmptyDescription>
                                    Sin una compra con su costo no hay inversión que
                                    recuperar. Registra la entrada y aquí verás
                                    cuánto llevas puesto.
                                </EmptyDescription>
                            </EmptyHeader>
                            <Button asChild className="mt-4">
                                <Link href="/dashboard/business/inventory/create">
                                    <Plus data-icon="inline-start" />
                                    Agregar entrada
                                </Link>
                            </Button>
                        </Empty>
                    ) : (
                        <>
                            <ProductRecoverySummary
                                data={data.data}
                                currency={currency}
                                exchangeRate={exchangeRate}
                                emphasis={emphasis}
                                unit={selectedProduct.product.unit}
                            />
                            <ProductPotentialValue
                                data={data.data}
                                currency={currency}
                                exchangeRate={exchangeRate}
                                emphasis={emphasis}
                                unit={selectedProduct.product.unit}
                            />
                            <ProductLotLedger
                                data={data.data}
                                currency={currency}
                                exchangeRate={exchangeRate}
                                emphasis={emphasis}
                                unit={selectedProduct.product.unit}
                            />
                        </>
                    ))}
            </section>
        </TooltipProvider>
    );
}
