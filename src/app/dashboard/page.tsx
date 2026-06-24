"use client"

import RecentExpensesTable from "@/components/dashboard/recent-expenses-table";
import RecentSalesTable from "@/components/dashboard/recent-sales-table";
import StatsCard from "@/components/dashboard/stats-card";
import CashBalanceWidget from "@/components/currency-account/cash-balance-widget";
import { useBusiness } from "@/context/business-context";
import { useDashboardSummary } from "@/hooks/use-business";

export default function DashboardPage() {

  const { activeBusinessId } = useBusiness();
  const { data: dashboardSummary } = useDashboardSummary(activeBusinessId ?? "");

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Panel Principal
        </h1>
        <p className="text-muted-foreground">
          Resumen general de tu negocio
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          variant="sales"
          title="Ventas"
          today={dashboardSummary?.sales?.today ?? []}
          yesterday={dashboardSummary?.sales?.yesterday ?? []}
          percentageChange={dashboardSummary?.sales?.percentageChange ?? 0}
          count={dashboardSummary?.sales?.totalTransactions}
        />
        <StatsCard
          variant="expenses"
          title="Gastos"
          today={dashboardSummary?.expenses?.today ?? []}
          yesterday={dashboardSummary?.expenses?.yesterday ?? []}
          percentageChange={dashboardSummary?.expenses?.percentageChange ?? 0}
          count={dashboardSummary?.expenses?.totalCount}
        />
        <CashBalanceWidget />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentSalesTable sales={dashboardSummary?.lastFiveSales} />
        <RecentExpensesTable expenses={dashboardSummary?.lastFiveExpenses} />
      </div>
    </div>
  )
}
