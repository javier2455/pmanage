import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardSummarySale } from "@/lib/types/business";
import { StatusBadge } from "@/components/generic/status-badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
    }).format(value);
}

function formatRelativeTime(iso: string) {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
    } catch {
        return "";
    }
}

type RecentSalesTableProps = {
    sales?: DashboardSummarySale[];
};

export default function RecentSalesTable({ sales }: RecentSalesTableProps) {
    const rows = sales ?? [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-card-foreground">Ventas recientes</CardTitle>
                <Link
                    href="/dashboard/business/sales"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    Ver todas
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                        Aún no hay datos que mostrar.
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {rows.map((sale) => (
                            <div
                                key={sale.id}
                                className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
                            >
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={cn(
                                            "text-sm font-medium text-card-foreground",
                                            sale.isCancelled && "line-through text-muted-foreground",
                                        )}
                                    >
                                        {sale.productName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelativeTime(sale.createdAt)}
                                    </p>
                                    {sale.isCancelled && sale.cancelledReason ? (
                                        <p className="text-xs text-destructive/90 mt-1"><span className="font-medium text-white dark:text-muted-foreground">Motivo:</span> {sale.cancelledReason}</p>
                                    ) : null}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span
                                        className={cn(
                                            "text-sm font-semibold text-card-foreground",
                                            sale.isCancelled && "line-through text-muted-foreground",
                                        )}
                                    >
                                        {formatCurrency(sale.total)}
                                    </span>
                                    {sale.isCancelled ? <StatusBadge text="Cancelada" /> : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
