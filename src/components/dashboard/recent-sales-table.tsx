import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardSummarySale } from "@/lib/types/business";
import { BASE_CURRENCY, formatMoney } from "@/lib/currency";
import { StatusBadge } from "@/components/generic/status-badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
                                className="grid grid-cols-[1fr_auto] items-start gap-3 py-2 border-b border-border last:border-0"
                            >
                                <div className="min-w-0 max-w-[65%]">
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
                                <div className="flex flex-col items-end gap-1">
                                    <span
                                        className={cn(
                                            "text-sm font-semibold text-card-foreground",
                                            sale.isCancelled && "line-through text-muted-foreground",
                                        )}
                                    >
                                        {formatMoney(sale.total, sale.currency ?? BASE_CURRENCY)}
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
