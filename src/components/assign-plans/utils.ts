import { Crown, Sparkles, Star } from "lucide-react"
import type { PlanResponse } from "@/lib/types/plans"

export type PlanStyle = {
  icon: typeof Star
  color: string
  bgColor: string
  borderColor: string
}

export function getPlanStyle(plan: PlanResponse): PlanStyle {
  const type = plan.type?.toLowerCase() ?? plan.name?.toLowerCase() ?? ""
  if (type.includes("basico")) return { icon: Star, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" }
  if (type.includes("pro")) return { icon: Sparkles, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" }
  if (type.includes("custom")) return { icon: Crown, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" }
  return { icon: Star, color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-border" }
}
