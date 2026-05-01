import { Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getPlanLabel, getPlanStyle } from "./utils"
import type { PlanResponse } from "@/lib/types/plans"
import type { UserDataResponse } from "@/lib/types/user"

interface AssignPlansStatsCardsProps {
  users: UserDataResponse[]
  plans: PlanResponse[]
}

export function AssignPlansStatsCards({ users, plans }: AssignPlansStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Usuarios</p>
            <p className="text-2xl font-bold text-card-foreground">{users.length}</p>
          </div>
        </CardContent>
      </Card>

      {plans.map((plan) => {
        const style = getPlanStyle(plan)
        const Icon = style.icon
        const count = users.filter((u) => u.plan?.id === plan.id).length
        return (
          <Card key={plan.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", style.bgColor)}>
                <Icon className={cn("h-5 w-5", style.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan {getPlanLabel(plan)}</p>
                <p className="text-2xl font-bold text-card-foreground">{count}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
