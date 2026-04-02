"use client"

import RecentActivityTable from "@/components/dashboard/recent-activity-table";
import RecentSalesTable from "@/components/dashboard/recent-sales-table";
import StatsCard from "@/components/dashboard/stats-card";
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

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard title="Ventas del dia" today={dashboardSummary?.sales.today ?? 0} percentageChange={dashboardSummary?.sales.percentageChange ?? 0} />
        <StatsCard title="Transacciones" today={dashboardSummary?.transactions.today ?? 0} percentageChange={dashboardSummary?.transactions.percentageChange ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentSalesTable sales={dashboardSummary?.lastFiveSales} />
        <RecentActivityTable activities={dashboardSummary?.recentActivity} />
      </div>
    </div>
  )
}
