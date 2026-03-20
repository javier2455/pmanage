"use client"

import { Users, MoreHorizontal, Search, Check, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PlanBadge } from "./plan-badge"
import { getPlanStyle } from "./utils"
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"

interface AssignPlansTableProps {
  users: UserDataResponse[]
  plans: PlanResponse[]
  isLoading: boolean
  searchQuery: string
  onSearchChange: (value: string) => void
  onPlanSelect: (user: UserDataResponse, plan: PlanResponse | null) => void
}

export function AssignPlansTable({
  users,
  plans,
  isLoading,
  searchQuery,
  onSearchChange,
  onPlanSelect,
}: AssignPlansTableProps) {
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card className="w-full max-w-full overflow-x-hidden">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Lista de Usuarios
              </CardTitle>
              <CardDescription>
                Selecciona un usuario para asignarle un plan
              </CardDescription>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="w-full max-w-full p-0">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Correo</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Plan Activo</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="h-24 text-center text-muted-foreground">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="h-24 text-center text-muted-foreground">
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-foreground">
                      {user.name}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-4 px-4">
                      <PlanBadge plan={user.plan ?? null} plans={plans} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Abrir menu"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-52 p-1">
                          <div className="px-2 py-1.5 text-sm font-medium">
                            Asignar Plan
                          </div>
                          <div className="my-1 h-px bg-border" />
                          {plans.map((plan) => {
                            const planStyle = getPlanStyle(plan)
                            const Icon = planStyle.icon
                            const s = planStyle.style
                            const isActive = user.plan?.id === plan.id
                            const hasHoverStyle = !isActive && s.color && s.backgroundColor && s.borderColor
                            const hasIconTextColor = s.color
                            return (
                              <button
                                key={plan.id}
                                type="button"
                                onClick={() => onPlanSelect(user, plan)}
                                disabled={isActive}
                                className={cn(
                                  "flex w-full items-center gap-2.5 rounded-sm border-l-4 border-transparent px-2 py-1.5 text-left text-sm transition-colors",
                                  isActive
                                    ? "cursor-default opacity-60"
                                    : "cursor-pointer hover:bg-muted"
                                )}
                                style={
                                  hasHoverStyle
                                    ? ({ "--plan-border": s.borderColor, "--plan-bg": s.backgroundColor } as React.CSSProperties)
                                    : undefined
                                }
                                onMouseEnter={(e) => {
                                  if (!hasHoverStyle || isActive) return
                                  e.currentTarget.style.borderLeftColor = `var(--plan-border)`
                                  e.currentTarget.style.backgroundColor = `var(--plan-bg)`
                                }}
                                onMouseLeave={(e) => {
                                  if (!hasHoverStyle || isActive) return
                                  e.currentTarget.style.borderLeftColor = "transparent"
                                  e.currentTarget.style.backgroundColor = ""
                                }}
                              >
                                <Icon className="size-4 shrink-0" style={hasIconTextColor ? { color: s.color } : undefined} />
                                <span style={hasIconTextColor ? { color: s.color } : undefined}>{plan.name}</span>
                                {isActive && (
                                  <Check className="ml-auto size-4 shrink-0 text-primary" />
                                )}
                              </button>
                            )
                          })}
                          <div className="my-1 h-px bg-border" />
                          <button
                            type="button"
                            onClick={() => onPlanSelect(user, null)}
                            disabled={!user.plan}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors text-destructive",
                              user.plan ? "cursor-pointer hover:bg-muted" : "cursor-default opacity-50"
                            )}
                          >
                            <X className="size-4 shrink-0" />
                            <span>Quitar plan</span>
                          </button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
