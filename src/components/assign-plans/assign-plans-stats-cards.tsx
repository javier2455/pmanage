import { Loader2, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getPlanLabel, getPlanStyle } from "./utils"
import type { PlanResponse } from "@/lib/types/plans"
import type { UserPlanStatsResponse } from "@/lib/types/user"

interface AssignPlansStatsCardsProps {
  stats: UserPlanStatsResponse | undefined
  plans: PlanResponse[]
  isLoading: boolean
}

export function AssignPlansStatsCards({
  stats,
  plans,
  isLoading,
}: AssignPlansStatsCardsProps) {
  const total = stats?.total ?? 0
  const byPlan = stats?.byPlan ?? {}

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Total Usuarios</p>
            <p className="text-2xl font-bold text-card-foreground">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                total
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {plans.map((plan) => {
        const style = getPlanStyle(plan)
        const Icon = style.icon
        const count = byPlan[plan.id] ?? 0
        return (
          <Card key={plan.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  style.bgColor,
                )}
              >
                <Icon className={cn("h-5 w-5", style.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Plan {getPlanLabel(plan)}
                </p>
                <p className="text-2xl font-bold text-card-foreground">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    count
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
