"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type {
  TopProductsSortBy,
  TopProductValueResponse,
} from "@/lib/types/analytics"

interface TopProductsChartProps {
  data: TopProductValueResponse[]
  sortBy: TopProductsSortBy
}

const chartConfig = {
  revenue: {
    label: "Ingresos",
    color: "var(--color-primary)",
  },
  quantity: {
    label: "Unidades",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig

function formatCurrencyShort(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function formatNumberShort(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toString()
}

function truncate(label: string, max = 22) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label
}

export function TopProductsChart({ data, sortBy }: TopProductsChartProps) {
  const hasData = data.length > 0

  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => b[sortBy] - a[sortBy])
        .map((item) => ({
          ...item,
          axisLabel: truncate(item.name),
        })),
    [data, sortBy],
  )

  const dynamicHeight = Math.max(220, chartData.length * 44)
  const dataKey = sortBy
  const formatter =
    sortBy === "revenue" ? formatCurrencyShort : formatNumberShort

  if (!hasData) {
    return (
      <div className="flex h-65 w-full items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        No hay productos vendidos en el período seleccionado.
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: dynamicHeight }}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 12, right: 24, top: 8, bottom: 8 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          tickFormatter={formatter}
          className="text-xs"
        />
        <YAxis
          type="category"
          dataKey="axisLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={140}
          className="text-xs"
        />
        <ChartTooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_label, payload) => {
                const product = payload?.[0]?.payload as
                  | TopProductValueResponse
                  | undefined
                if (!product) return ""
                return product.category
                  ? `${product.name} · ${product.category}`
                  : product.name
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
                  chartConfig.quantity.label,
                ]
              }}
              indicator="dot"
            />
          }
        />
        <Bar
          dataKey={dataKey}
          fill="var(--color-primary)"
          radius={[0, 6, 6, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ChartContainer>
  )
}
