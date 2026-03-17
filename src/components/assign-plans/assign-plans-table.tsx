"use client"

import { Users, MoreHorizontal, Search, Check, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    <Card>
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
      <CardContent className="p-0">
        <div className="w-full overflow-x-auto">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" collisionPadding={16} avoidCollisions>
                          <DropdownMenuLabel>Asignar Plan</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {plans.map((plan) => {
                            const style = getPlanStyle(plan)
                            const Icon = style.icon
                            const isActive = user.plan?.id === plan.id
                            return (
                              <DropdownMenuItem
                                key={plan.id}
                                onClick={() => onPlanSelect(user, plan)}
                                disabled={isActive}
                                className={cn("gap-2", isActive && "opacity-50")}
                              >
                                <Icon className={cn("h-4 w-4", style.color)} />
                                <span>{plan.name}</span>
                                {isActive && (
                                  <Check className="ml-auto h-4 w-4 text-primary" />
                                )}
                              </DropdownMenuItem>
                            )
                          })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onPlanSelect(user, null)}
                            disabled={!user.plan}
                            className={cn(
                              "gap-2 text-destructive focus:text-destructive",
                              !user.plan && "opacity-50"
                            )}
                          >
                            <X className="h-4 w-4" />
                            <span>Quitar plan</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
