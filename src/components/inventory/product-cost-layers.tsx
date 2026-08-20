"use client";

import * as React from "react";
import { Layers, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductCostLayers } from "@/hooks/use-inventory";
import type { InventoryCostLayer } from "@/lib/types/inventory";
import { formatStockWithUnit } from "@/lib/units";
import { formatMoney } from "@/lib/currency";
import { formatDateShort } from "@/lib/dates";
import { cn, DASH } from "@/lib/utils";


/**
 * Importe con su moneda real.
 *
 * El formateo va con `Intl` en modo decimal y el código de moneda aparte, para
 * no repetir el fallo de dar por hecho que todo importe es de una moneda fija:
 * un lote comprado en dólares tiene que verse en dólares.
 */
function formatAmount(value: number, currency: string) {
    // Con `Intl` en es-ES esto imprimía "1.234,50 CUP"; el resto del sistema
    // muestra "1,234.50 CUP".
    if (!Number.isFinite(value)) return DASH;
    return formatMoney(value, currency);
}

/**
 * Cantidad de un lote con su unidad. Antes se pintaba siempre con "uds" y hasta
 * dos decimales, así que un producto por piezas mostraba "3 uds" pero uno a
 * granel mentía: "0,5 uds" en vez de "0,5 kg".
 */
function formatLayerQuantity(value: number, unit?: string | null) {
    if (!Number.isFinite(value)) return DASH;
    return formatStockWithUnit(value, unit);
}

interface ProductCostLayersProps {
    businessId: string;
    productId: string;
    /**
     * Unidad del producto (`ud`, `kg`, `L`…). Decide si las cantidades de cada
     * lote se muestran redondeadas o con decimales. La respuesta de capas no la
     * trae, así que la pone la vista, que ya sabe qué producto está mirando.
     */
    unit?: string | null;
    className?: string;
}

/**
 * Lotes vivos de un producto, del más antiguo al más reciente.
 *
 * Responde la pregunta que el precio de entrada no puede contestar: de las
 * unidades que hay en el almacén, cuántas vinieron de cada compra y a qué costo.
 * El primero de la lista es el que alimentará la próxima venta, porque el stock
 * se consume en orden de llegada.
 */
export function ProductCostLayers({
    businessId,
    productId,
    unit,
    className,
}: ProductCostLayersProps) {
    const { data, isLoading, isError } = useProductCostLayers(businessId, productId);

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Layers className="size-4" aria-hidden="true" />
                        Lotes en stock
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (isError || !data?.data) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Layers className="size-4" aria-hidden="true" />
                        Lotes en stock
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No se pudieron cargar los lotes de este producto.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { layers, totalValue, uncostedQuantity } = data.data;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="size-4" aria-hidden="true" />
                    Lotes en stock
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Las unidades salen en orden de llegada. El primer lote es el que
                    alimentará la próxima venta.
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {layers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Este producto no tiene lotes con costo registrado.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {layers.map((layer, index) => (
                            <CostLayerRow
                                key={layer.id}
                                layer={layer}
                                unit={unit}
                                isNext={index === 0}
                            />
                        ))}
                    </ul>
                )}

                {layers.length > 0 && (
                    <div className="flex items-center justify-between border-t pt-3 text-sm">
                        <span className="text-muted-foreground">Valor del inventario</span>
                        <span className="font-medium tabular-nums">
                            {formatAmount(totalValue, "CUP")}
                        </span>
                    </div>
                )}

                {uncostedQuantity > 0 && (
                    <p className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>
                            {formatLayerQuantity(uncostedQuantity, unit)} en stock sin costo
                            registrado; no entran en el valor mostrado. Suelen ser
                            existencias anteriores al control por lotes.
                        </span>
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function CostLayerRow({
    layer,
    unit,
    isNext,
}: {
    layer: InventoryCostLayer;
    unit?: string | null;
    isNext: boolean;
}) {
    // Solo tiene sentido mostrar el equivalente en pesos cuando la compra se hizo
    // en otra moneda; si no, se repetiría la misma cifra dos veces.
    const isForeignCurrency = layer.currency !== "CUP";

    return (
        <li
            className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-md border p-3",
                isNext && "border-primary/30 bg-primary/5",
            )}
        >
            <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium tabular-nums">
                        {formatLayerQuantity(layer.remainingQuantity, unit)}
                    </span>
                    <span className="text-muted-foreground">a</span>
                    <span className="font-medium tabular-nums">
                        {formatAmount(layer.unitCost, layer.currency)}
                    </span>
                    {isNext && (
                        <Badge variant="secondary" className="text-xs">
                            Sale primero
                        </Badge>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    Comprado el {formatDateShort(layer.acquiredAt)}
                    {layer.providerName ? ` a ${layer.providerName}` : ""}
                    {layer.originalQuantity !== layer.remainingQuantity
                        ? ` · lote original de ${formatLayerQuantity(layer.originalQuantity, unit)}`
                        : ""}
                </p>
            </div>

            <div className="text-right">
                <p className="font-medium tabular-nums">
                    {formatAmount(layer.remainingQuantity * layer.unitCostBase, "CUP")}
                </p>
                {isForeignCurrency && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {formatAmount(layer.unitCostBase, "CUP")}/{unit || "ud"} · tasa{" "}
                        {new Intl.NumberFormat("es-ES", {
                            maximumFractionDigits: 2,
                        }).format(layer.exchangeRateApplied)}
                    </p>
                )}
            </div>
        </li>
    );
}
