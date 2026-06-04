"use client"

import { useMemo } from "react"
import { parseISO, format } from "date-fns"
import { es } from "date-fns/locale"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type {
  AnalyticsSalesTrendGroupBy,
  SalesTrendValuesResponse,
} from "@/lib/types/analytics"

interface SalesTrendChartProps {
  data: SalesTrendValuesResponse[]
  groupBy: AnalyticsSalesTrendGroupBy
}

const chartConfig = {
  revenue: {
    label: "Ingresos",
    color: "var(--color-primary)",
  },
  transactions: {
    label: "Transacciones",
    color: "var(--color-muted-foreground)",
  },
} satisfies ChartConfig

function formatAxisDate(date: string, groupBy: AnalyticsSalesTrendGroupBy) {
  const parsed = parseISO(date)
  if (groupBy === "month") {
    return format(parsed, "MMM yy", { locale: es })
  }
  if (groupBy === "week") {
    return format(parsed, "dd MMM", { locale: es })
  }
  return format(parsed, "dd MMM", { locale: es })
}

function formatTooltipDate(date: string, groupBy: AnalyticsSalesTrendGroupBy) {
  const parsed = parseISO(date)
  if (groupBy === "month") {
    return format(parsed, "MMMM 'de' yyyy", { locale: es })
  }
  if (groupBy === "week") {
    return `Semana del ${format(parsed, "dd 'de' MMMM", { locale: es })}`
  }
  return format(parsed, "dd 'de' MMMM, yyyy", { locale: es })
}

function formatCurrencyShort(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

export function SalesTrendChart({ data, groupBy }: SalesTrendChartProps) {
  const hasData = data.length > 0

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        axisLabel: formatAxisDate(d.date, groupBy),
      })),
    [data, groupBy],
  )

  if (!hasData) {
    return (
      <div className="flex h-65 w-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        No hay datos de ventas para el período seleccionado.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-65 w-full">
      <AreaChart data={chartData} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-revenue)"
              stopOpacity={0.35}
            />
            <stop
              offset="95%"
              stopColor="var(--color-revenue)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="axisLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={50}
          tickFormatter={formatCurrencyShort}
          className="text-xs"
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) => {
                const raw = payload?.[0]?.payload?.date as string | undefined
                return raw ? formatTooltipDate(raw, groupBy) : ""
              }}
              formatter={(value, name) => {
                if (name === "revenue") {
                  return [
                    `$${Number(value).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    chartConfig.revenue.label,
                  ]
                }
                return [
                  Number(value).toLocaleString("en-US"),
                  chartConfig.transactions.label,
                ]
              }}
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill="url(#fillRevenue)"
        />
      </AreaChart>
    </ChartContainer>
  )
}
