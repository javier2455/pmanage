import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { ArrowDownRight, ArrowUpRight, DollarSign, Minus, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatsCardVariant = 'sales' | 'expenses'

interface StatsCardProps {
  variant: StatsCardVariant
  title: string
  today: number
  yesterday: number
  percentageChange: number
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
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
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Hoy</p>
            <div className="text-2xl font-bold text-card-foreground">{formatCurrency(today)}</div>
          </div>
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              trendClass,
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{formattedChange}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs text-muted-foreground">Ayer</span>
          <span className="text-sm font-medium text-card-foreground">
            {formatCurrency(yesterday)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
