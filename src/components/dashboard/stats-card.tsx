import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ArrowDownRight, ArrowUpRight, DollarSign, Minus, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BASE_CURRENCY, formatMoney } from '@/lib/currency'
import type { DashboardCurrencyTotal } from '@/lib/types/business'

type StatsCardVariant = 'sales' | 'expenses'

interface StatsCardProps {
  variant: StatsCardVariant
  title: string
  today: DashboardCurrencyTotal[]
  yesterday: DashboardCurrencyTotal[]
  percentageChange: number
  count?: number
}

function trendDirection(change: number, variant: StatsCardVariant) {
  if (change === 0) return 'flat'
  const isPositive = change > 0
  if (variant === 'sales') return isPositive ? 'up-good' : 'down-bad'
  return isPositive ? 'up-bad' : 'down-good'
}

export default function StatsCard({
  variant,
  title,
  today,
  yesterday,
  percentageChange,
  count,
}: StatsCardProps) {
  const direction = trendDirection(percentageChange, variant)
  const isGood = direction === 'up-good' || direction === 'down-good'
  const isFlat = direction === 'flat'

  const trendClass = isFlat
    ? 'text-muted-foreground bg-muted'
    : isGood
      ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10'
      : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10'

  const TrendIcon = isFlat ? Minus : percentageChange > 0 ? ArrowUpRight : ArrowDownRight
  const Icon = variant === 'sales' ? DollarSign : Receipt

  const formattedChange = `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(2)}%`

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Hoy</p>
            {today.length === 0 ? (
              <div className="text-2xl font-bold text-card-foreground">
                {formatMoney(0, BASE_CURRENCY)}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {today.map((item) => (
                  <div
                    key={item.currency}
                    className="text-2xl font-bold text-card-foreground"
                  >
                    {formatMoney(item.total, item.currency)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              trendClass,
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{formattedChange}</span>
          </div>
        </div>
        <div className="mt-3 flex items-start justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Ayer</span>
          <div className="flex flex-col items-end gap-0.5">
            {yesterday.length === 0 ? (
              <span className="text-sm font-medium text-card-foreground">
                {formatMoney(0, BASE_CURRENCY)}
              </span>
            ) : (
              yesterday.map((item) => (
                <span
                  key={item.currency}
                  className="text-sm font-medium text-card-foreground"
                >
                  {formatMoney(item.total, item.currency)}
                </span>
              ))
            )}
          </div>
        </div>
        {typeof count === 'number' ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {count} {count === 1 ? 'transacción' : 'transacciones'}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
