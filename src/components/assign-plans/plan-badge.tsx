import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getPlanLabel, getPlanStyle } from "./utils"
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
  const planStyle = planFromList ? getPlanStyle(planFromList) : getPlanStyle({ type: plan.name, name: plan.name })
  const Icon = planStyle.icon
  const s = planStyle.style

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border", planStyle.bgColor, planStyle.color, planStyle.borderColor)}
      style={s.color ? { backgroundColor: s.backgroundColor, borderColor: s.borderColor, color: s.color } : undefined}
    >
      <Icon className="h-3 w-3 shrink-0" style={s.color ? { color: s.color } : undefined} />
      {getPlanLabel(plan)}
    </Badge>
  )
}
