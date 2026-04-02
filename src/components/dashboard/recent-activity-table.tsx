import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { DashboardSummaryActivity } from "@/lib/types/business";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

function formatRelativeTime(iso: string) {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
    } catch {
        return "";
    }
}

const ACTION_LABELS: Record<string, string> = {
    sell: "Venta",
    sale: "Venta",
    cancel: "Cancelación",
    cancelled: "Cancelación",
    stock_in: "Entrada de inventario",
    stock_out: "Salida de inventario",
    adjustment: "Ajuste de inventario",
};

function actionLabel(actionType: string) {
    const key = actionType.toLowerCase();
    return ACTION_LABELS[key] ?? actionType;
}

type RecentActivityTableProps = {
    activities?: DashboardSummaryActivity[];
};

export default function RecentActivityTable({ activities }: RecentActivityTableProps) {
    const rows = activities ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-card-foreground">Actividad reciente</CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                        Aún no hay datos que mostrar.
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {rows.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-card-foreground">
                                        {activity.productName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.description?.trim() ||
                                            `${actionLabel(activity.actionType)} · ${activity.quantity} u.`}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                    {formatRelativeTime(activity.createdAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
