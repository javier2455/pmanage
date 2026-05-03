import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DashboardSummaryExpense } from "@/lib/types/business";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

function formatCurrency(value: number) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatRelativeTime(iso: string) {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
    } catch {
        return "";
    }
}

type RecentExpensesTableProps = {
    expenses?: DashboardSummaryExpense[];
};

export default function RecentExpensesTable({ expenses }: RecentExpensesTableProps) {
    const rows = expenses ?? [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-card-foreground">Gastos recientes</CardTitle>
                <Link
                    href="/dashboard/business/expenses"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    Ver todos
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
                        {rows.map((expense) => (
                            <div
                                key={expense.id}
                                className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-card-foreground truncate">
                                        {expense.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatRelativeTime(expense.createdAt)}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end">
                                    <span className="text-sm font-semibold text-red-600 dark:text-red-500">
                                        -{formatCurrency(expense.amount)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
