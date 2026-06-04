import { ArrowDown, ArrowUp, Info, Minus, type LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type ChangeDirection = "up" | "down" | "neutral"

type KpiCardVariant = "default" | "inverse"

interface KpiCardProps {
  title: string
  value: number
  change: number
  icon: LucideIcon
  description?: string
  tooltip?: string
  format?: "currency" | "number" | "percent"
  variant?: KpiCardVariant
}

function formatValue(value: number, format: KpiCardProps["format"]) {
  if (format === "currency") {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  if (format === "percent") {
    return `${value.toFixed(1)}%`
  }

  return value.toLocaleString("en-US")
}

function resolveDirection(change: number, variant: KpiCardVariant): ChangeDirection {
  if (change === 0) return "neutral"
  const isPositive = variant === "inverse" ? change < 0 : change > 0
  return isPositive ? "up" : "down"
}

export function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  tooltip,
  format = "number",
  variant = "default",
}: KpiCardProps) {
  const direction = resolveDirection(change, variant)

  const changeStyles = {
    up: "text-emerald-600 dark:text-emerald-500",
    down: "text-red-600 dark:text-red-500",
    neutral: "text-muted-foreground",
  }[direction]

  const ChangeIcon = {
    up: ArrowUp,
    down: ArrowDown,
    neutral: Minus,
  }[direction]

  return (
    <Card className="relative">
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Más información sobre ${title}`}
                className="absolute right-3 top-3 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
              >
                <Info className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="max-w-xs text-left">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <CardHeader className="flex flex-row items-center gap-2 pb-2 pr-10">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <CardTitle className="text-sm font-semibold text-foreground/80 dark:text-foreground/90">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">
          {formatValue(value, format)}
        </div>
        <div className={cn("mt-1 flex items-center gap-1 text-xs", changeStyles)}>
          <ChangeIcon className="h-3 w-3" />
          <span className="tabular-nums">
            {change > 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
          {description && (
            <span className="text-muted-foreground">· {description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
