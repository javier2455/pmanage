"use client"

import { Check, RefreshCw, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PlanBadge } from "./plan-badge"
import { getPlanStyle } from "./utils"
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"

interface AssignPlanConfirmDialogProps {
  open: boolean
  user: UserDataResponse | null
  newPlan: PlanResponse | null
  saving: boolean
  startDate: string
  endDate: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
  plans: PlanResponse[]
}

export function AssignPlanConfirmDialog({
  open,
  user,
  newPlan,
  saving,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onConfirm,
  onCancel,
  plans,
}: AssignPlanConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !saving && !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Confirmar cambio de plan
          </DialogTitle>
          <DialogDescription>
            {newPlan
              ? `Estas a punto de asignar el plan ${newPlan.name} a ${user?.name}.`
              : `Estas a punto de quitar el plan a ${user?.name}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="min-w-0">
              <p className="font-medium text-card-foreground truncate">
                {user?.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">Plan actual</span>
              <PlanBadge plan={user?.plan ?? null} plans={plans} />
            </div>
          </div>

          {newPlan && (
            <div className={cn(
              "flex items-center gap-3 rounded-lg border p-4",
              getPlanStyle(newPlan).bgColor,
              getPlanStyle(newPlan).borderColor
            )}>
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                getPlanStyle(newPlan).bgColor
              )}>
                {(() => {
                  const style = getPlanStyle(newPlan)
                  const Icon = style.icon
                  return <Icon className={cn("h-5 w-5", style.color)} />
                })()}
              </div>
              <div>
                <p className={cn("font-medium", getPlanStyle(newPlan).color)}>
                  Plan {newPlan.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Nuevo plan a asignar
                </p>
              </div>
            </div>
          )}

          {!newPlan && (
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

          {newPlan && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 min-w-0">
              <div className="flex flex-col gap-2 min-w-0">
                <label htmlFor="start-date" className="text-sm font-medium text-foreground">
                  Fecha de inicio
                </label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
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
                  onChange={(e) => onEndDateChange(e.target.value)}
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
            onClick={onCancel}
            disabled={saving}
            className="bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={saving || (!!newPlan && !endDate.trim()) || !newPlan}
            className={cn(
              newPlan === null &&
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
  )
}
