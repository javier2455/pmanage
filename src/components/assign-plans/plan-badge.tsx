import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getPlanStyle } from "./utils"
import type { PlanResponse } from "@/lib/types/plans"

interface PlanBadgeProps {
  plan: { id: string; name: string } | null
  plans: PlanResponse[]
}

export function PlanBadge({ plan, plans }: PlanBadgeProps) {
  if (!plan) {
    return (
      <Badge
        variant="outline"
        className="bg-muted/50 text-muted-foreground border-border"
      >
        Sin plan
      </Badge>
    )
  }

  const planFromList = plans.find((p) => p.id === plan.id)
  const style = planFromList ? getPlanStyle(planFromList) : { icon: Star, color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-border" }
  const Icon = style.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        style.bgColor,
        style.color,
        style.borderColor
      )}
    >
      <Icon className="h-3 w-3" />
      {plan.name}
    </Badge>
  )
}
