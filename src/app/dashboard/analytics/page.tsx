"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { format, subDays } from "date-fns"
import { Gauge, Trophy, TrendingUp } from "lucide-react"

import { useBusiness } from "@/context/business-context"
import {
  useAnalyticsKPIs,
  useAnalyticsSalesTrend,
  useAnalyticsTopProducts,
} from "@/hooks/use-analytics"
import { KpisGrid } from "@/components/analytics/kpis-grid"
import { PeriodFilter } from "@/components/analytics/period-filter"
import { SalesTrendFilter } from "@/components/analytics/sales-trend-filter"
import { SalesTrendChart } from "@/components/analytics/sales-trend-chart"
import { TopProductsFilter } from "@/components/analytics/top-products-filter"
import { TopProductsChart } from "@/components/analytics/top-products-chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  AnalyticsPeriod,
  AnalyticsSalesTrendGroupBy,
  TopProductsLimit,
  TopProductsSortBy,
} from "@/lib/types/analytics"

function AnalyticsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}

const DEFAULT_RANGE_DAYS = 30

export default function AnalyticsPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const { activeBusinessId } = useBusiness()
  const [period, setPeriod] = useState<AnalyticsPeriod>("month")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [groupBy, setGroupBy] = useState<AnalyticsSalesTrendGroupBy>("day")
  const [topProductsPeriod, setTopProductsPeriod] =
    useState<AnalyticsPeriod>("month")
  const [topProductsSortBy, setTopProductsSortBy] =
    useState<TopProductsSortBy>("revenue")
  const [topProductsLimit, setTopProductsLimit] =
    useState<TopProductsLimit>(5)

  const trendParams = useMemo(() => {
    if (startDate && endDate) {
      return {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        groupBy,
      }
    }

    const today = new Date()
    const defaultStart = subDays(today, DEFAULT_RANGE_DAYS)
    return {
      startDate: format(startDate ?? defaultStart, "yyyy-MM-dd"),
      endDate: format(endDate ?? today, "yyyy-MM-dd"),
      groupBy,
    }
  }, [startDate, endDate, groupBy])

  const {
    data: kpisData,
    isLoading: isKpisLoading,
    isError: isKpisError,
  } = useAnalyticsKPIs(activeBusinessId ?? "", { period })

  const {
    data: trendData,
    isLoading: isTrendLoading,
    isError: isTrendError,
  } = useAnalyticsSalesTrend(activeBusinessId ?? "", trendParams)

  const {
    data: topProductsData,
    isLoading: isTopProductsLoading,
    isError: isTopProductsError,
  } = useAnalyticsTopProducts(activeBusinessId ?? "", {
    period: topProductsPeriod,
    sortBy: topProductsSortBy,
    limit: topProductsLimit,
  })

  if (!mounted || isKpisLoading) {
    return <AnalyticsPageSkeleton />
  }

  if (!activeBusinessId) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold text-foreground">Analítica</h1>
        <p className="text-muted-foreground">
          Selecciona un negocio para ver las analíticas.
        </p>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analítica
        </h1>
        <p className="text-muted-foreground">
          Estadísticas y métricas de tu negocio
        </p>
      </div>

      <Card className="gap-4 py-4">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Gauge className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Indicadores clave
                </CardTitle>
                <CardDescription>
                  Métricas principales del negocio por período
                </CardDescription>
              </div>
            </div>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </CardHeader>
        <CardContent>
          {isKpisError || !kpisData ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              Error al cargar los indicadores. Intenta nuevamente más tarde.
            </div>
          ) : (
            <KpisGrid data={kpisData} period={period} />
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 py-4">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Tendencia de ventas
                </CardTitle>
                <CardDescription>
                  Evolución de los ingresos en el tiempo
                </CardDescription>
              </div>
            </div>
            <SalesTrendFilter
              startDate={startDate}
              endDate={endDate}
              groupBy={groupBy}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onGroupByChange={setGroupBy}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isTrendLoading ? (
            <div className="h-65 w-full animate-pulse rounded-md bg-muted" />
          ) : isTrendError || !trendData ? (
            <div className="flex h-65 w-full items-center justify-center rounded-md border border-dashed border-destructive/30 text-sm text-destructive">
              Error al cargar la tendencia de ventas.
            </div>
          ) : (
            <SalesTrendChart data={trendData.data} groupBy={groupBy} />
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 py-4">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Productos más vendidos
                </CardTitle>
                <CardDescription>
                  Ranking por ingresos o unidades vendidas
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodFilter
                value={topProductsPeriod}
                onChange={setTopProductsPeriod}
              />
              <TopProductsFilter
                sortBy={topProductsSortBy}
                limit={topProductsLimit}
                onSortByChange={setTopProductsSortBy}
                onLimitChange={setTopProductsLimit}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isTopProductsLoading ? (
            <div className="h-65 w-full animate-pulse rounded-md bg-muted" />
          ) : isTopProductsError || !topProductsData ? (
            <div className="flex h-65 w-full items-center justify-center rounded-md border border-dashed border-destructive/30 text-sm text-destructive">
              Error al cargar los productos más vendidos.
            </div>
          ) : (
            <TopProductsChart
              data={topProductsData.data}
              sortBy={topProductsSortBy}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
