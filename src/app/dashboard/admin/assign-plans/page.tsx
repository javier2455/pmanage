"use client"

import { useState } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Users,
  MoreHorizontal,
  Search,
  Crown,
  Sparkles,
  Star,
  Check,
  X,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Plan = "basico" | "pro" | "custom" | null

interface User {
  id: string
  name: string
  email: string
  plan: Plan
  joinedAt: string
}

const USERS: User[] = [
  { id: "1", name: "Carlos Martinez", email: "carlos@example.com", plan: "pro", joinedAt: "2024-01-15" },
  { id: "2", name: "Maria Garcia", email: "maria@example.com", plan: "basico", joinedAt: "2024-02-20" },
  { id: "3", name: "Juan Rodriguez", email: "juan@example.com", plan: null, joinedAt: "2024-03-10" },
  { id: "4", name: "Ana Lopez", email: "ana@example.com", plan: "custom", joinedAt: "2024-01-05" },
  { id: "5", name: "Pedro Sanchez", email: "pedro@example.com", plan: "basico", joinedAt: "2024-04-12" },
  { id: "6", name: "Laura Torres", email: "laura@example.com", plan: null, joinedAt: "2024-05-01" },
  { id: "7", name: "Diego Ramirez", email: "diego@example.com", plan: "pro", joinedAt: "2024-02-28" },
  { id: "8", name: "Sofia Hernandez", email: "sofia@example.com", plan: null, joinedAt: "2024-06-15" },
]

const PLANS = [
  { id: "basico", name: "Basico", icon: Star, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  { id: "pro", name: "Pro", icon: Sparkles, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  { id: "custom", name: "Custom", icon: Crown, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
] as const

export default function AssignPlansPage() {
  const [users, setUsers] = useState<User[]>(USERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    user: User | null
    newPlan: Plan
  }>({ open: false, user: null, newPlan: null })
  const [saving, setSaving] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getPlanBadge = (plan: Plan) => {
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

    const planInfo = PLANS.find((p) => p.id === plan)
    if (!planInfo) return null

    const Icon = planInfo.icon

    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1",
          planInfo.bgColor,
          planInfo.color,
          planInfo.borderColor
        )}
      >
        <Icon className="h-3 w-3" />
        {planInfo.name}
      </Badge>
    )
  }

  const handlePlanSelect = (user: User, plan: Plan) => {
    const today = new Date().toISOString().split("T")[0]
    setStartDate(today)
    setEndDate("")
    setConfirmDialog({ open: true, user, newPlan: plan })
  }

  const handleConfirm = () => {
    if (!confirmDialog.user) return

    setSaving(true)
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmDialog.user?.id
            ? { ...u, plan: confirmDialog.newPlan }
            : u
        )
      )
      setSaving(false)
      setConfirmDialog({ open: false, user: null, newPlan: null })
    }, 1000)
  }

  const handleCancel = () => {
    setConfirmDialog({ open: false, user: null, newPlan: null })
    setStartDate("")
    setEndDate("")
  }

  const selectedPlanInfo = confirmDialog.newPlan
    ? PLANS.find((p) => p.id === confirmDialog.newPlan)
    : null

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Asignar Planes
        </h1>
        <p className="text-muted-foreground">
          Administra los planes de suscripcion de los usuarios
        </p>
      </div>

      {/* Stats Cards */}
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

        {PLANS.map((plan) => {
          const Icon = plan.icon
          const count = users.filter((u) => u.plan === plan.id).length
          return (
            <Card key={plan.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", plan.bgColor)}>
                  <Icon className={cn("h-5 w-5", plan.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan {plan.name}</p>
                  <p className="text-2xl font-bold text-card-foreground">{count}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Users Table */}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                {filteredUsers.length === 0 ? (
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
                      <td className="py-4 px-4">{getPlanBadge(user.plan)}</td>
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
                            {PLANS.map((plan) => {
                              const Icon = plan.icon
                              const isActive = user.plan === plan.id
                              return (
                                <DropdownMenuItem
                                  key={plan.id}
                                  onClick={() => handlePlanSelect(user, plan.id as Plan)}
                                  disabled={isActive}
                                  className={cn("gap-2", isActive && "opacity-50")}
                                >
                                  <Icon className={cn("h-4 w-4", plan.color)} />
                                  <span>{plan.name}</span>
                                  {isActive && (
                                    <Check className="ml-auto h-4 w-4 text-primary" />
                                  )}
                                </DropdownMenuItem>
                              )
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handlePlanSelect(user, null)}
                              disabled={user.plan === null}
                              className={cn(
                                "gap-2 text-destructive focus:text-destructive",
                                user.plan === null && "opacity-50"
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !saving && !open && handleCancel()}>
        <DialogContent className="sm:max-w-md overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Confirmar cambio de plan
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.newPlan
                ? `Estas a punto de asignar el plan ${selectedPlanInfo?.name} a ${confirmDialog.user?.name}.`
                : `Estas a punto de quitar el plan a ${confirmDialog.user?.name}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="min-w-0">
                <p className="font-medium text-card-foreground truncate">
                  {confirmDialog.user?.name}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {confirmDialog.user?.email}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-xs text-muted-foreground">Plan actual</span>
                {getPlanBadge(confirmDialog.user?.plan ?? null)}
              </div>
            </div>

            {confirmDialog.newPlan && selectedPlanInfo && (
              <div className={cn(
                "flex items-center gap-3 rounded-lg border p-4",
                selectedPlanInfo.bgColor,
                selectedPlanInfo.borderColor
              )}>
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  selectedPlanInfo.bgColor
                )}>
                  <selectedPlanInfo.icon className={cn("h-5 w-5", selectedPlanInfo.color)} />
                </div>
                <div>
                  <p className={cn("font-medium", selectedPlanInfo.color)}>
                    Plan {selectedPlanInfo.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nuevo plan a asignar
                  </p>
                </div>
              </div>
            )}

            {!confirmDialog.newPlan && (
              <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-medium text-destructive">Sin plan</p>
                  <p className="text-sm text-muted-foreground">
                    El usuario quedara sin plan asignado
                  </p>
                </div>
              </div>
            )}

            {confirmDialog.newPlan && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="start-date" className="text-sm font-medium text-foreground">
                    Fecha de inicio
                  </label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-background w-full max-w-full"
                  />
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <label htmlFor="end-date" className="text-sm font-medium text-foreground">
                    Fecha de expiracion
                  </label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="bg-background w-full max-w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className={cn(
                confirmDialog.newPlan === null &&
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
