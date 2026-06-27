"use client"

import { ArrowDown, CalendarPlus, Check, Clock, RefreshCw, RotateCw, X } from "lucide-react"
import { addDays, differenceInDays, format, parseISO, startOfDay } from "date-fns"
import { es } from "date-fns/locale"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PlanBadge } from "./plan-badge"
import { getPlanLabel, getPlanStyle } from "./utils"
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"

export type AssignPlanDialogMode = "assign" | "extend" | "remove"

interface AssignPlanConfirmDialogProps {
  open: boolean
  mode: AssignPlanDialogMode
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

const QUICK_EXTEND_OPTIONS: { days: number; label: string }[] = [
  { days: 7, label: "+7 días" },
  { days: 15, label: "+15 días" },
  { days: 30, label: "+30 días" },
  { days: 90, label: "+90 días" },
  { days: 365, label: "+1 año" },
]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function localDateString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseDateInput(value: string): Date | null {
  if (!value) return null
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function addDaysToInput(value: string, days: number): string {
  const base = parseDateInput(value)
  if (!base) return ""
  return localDateString(addDays(base, days))
}

function formatPretty(value: string): string {
  const d = parseDateInput(value)
  if (!d) return ""
  return format(d, "dd MMM yyyy", { locale: es })
}

export function AssignPlanConfirmDialog({
  open,
  mode,
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
  const newPlanStyle = newPlan ? getPlanStyle(newPlan) : null
  const userPlanStyle = user?.plan ? getPlanStyle({ name: user.plan.name }) : null
  const today = startOfDay(new Date())

  const currentExpiry =
    mode === "extend" && user?.plan?.expiresAt
      ? startOfDay(parseISO(user.plan.expiresAt))
      : null
  const daysUntilExpiry = currentExpiry
    ? differenceInDays(currentExpiry, today)
    : null
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0

  const todayStr = localDateString(new Date())
  const extendBase = mode === "extend" && currentExpiry
    ? (isExpired ? todayStr : localDateString(currentExpiry))
    : null

  const baseDateForChips = mode === "extend"
    ? (extendBase ?? startDate)
    : startDate

  const minEndDate = mode === "extend"
    ? (extendBase ?? startDate)
    : startDate

  const newExpiryDate = parseDateInput(endDate)

  const totalDaysFromToday =
    newExpiryDate ? differenceInDays(startOfDay(newExpiryDate), today) : null

  /** Días ganados respecto al estado actual:
   *  - Plan vigente: desde el vencimiento actual.
   *  - Plan vencido: desde hoy (la extensión arranca de cero).
   */
  const extraDays =
    mode === "extend" && currentExpiry && newExpiryDate
      ? differenceInDays(
          startOfDay(newExpiryDate),
          isExpired ? today : currentExpiry,
        )
      : null

  const titles: Record<AssignPlanDialogMode, string> = {
    assign: "Confirmar cambio de plan",
    extend: "Extender plan",
    remove: "Quitar plan",
  }

  const description =
    mode === "extend"
      ? `Estás a punto de extender el plan ${user?.plan?.name ?? ""} de ${user?.name ?? ""}.`
      : mode === "remove"
        ? `Estás a punto de quitar el plan a ${user?.name ?? ""}.`
        : `Estás a punto de asignar el plan ${newPlan?.name ?? ""} a ${user?.name ?? ""}.`

  const showDateInputs = mode !== "remove"
  const showQuickChips = mode !== "remove" && Boolean(baseDateForChips)

  function handleQuickChip(days: number) {
    if (!baseDateForChips) return
    onEndDateChange(addDaysToInput(baseDateForChips, days))
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !saving && !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-foreground">{titles[mode]}</DialogTitle>
            {mode === "extend" && isExpired ? (
              <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
                <Clock className="mr-1 h-3 w-3" />
                Vencido hace {Math.abs(daysUntilExpiry!)} d
              </Badge>
            ) : null}
            {mode === "extend" && !isExpired && daysUntilExpiry !== null && daysUntilExpiry <= 7 ? (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="mr-1 h-3 w-3" />
                Vence en {daysUntilExpiry} d
              </Badge>
            ) : null}
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-4 py-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4 dark:bg-muted/20">
            <div className="min-w-0">
              <p className="font-medium text-card-foreground truncate">
                {user?.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs text-muted-foreground">
                {mode === "extend" ? "Plan a extender" : "Plan actual"}
              </span>
              <PlanBadge plan={user?.plan ?? null} plans={plans} />
            </div>
          </div>

          {mode === "extend" && userPlanStyle && user?.plan ? (
            <>
              <div className="flex flex-col items-center gap-2 py-0.5">
                <div className="h-px w-full max-w-[140px] bg-linear-to-r from-transparent via-border to-transparent" />
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "border border-border bg-card text-primary shadow-sm",
                    "dark:bg-card/80",
                  )}
                >
                  <RotateCw className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <span className="text-center text-xs font-medium text-muted-foreground">
                  {isExpired
                    ? "Reactivación desde hoy"
                    : "Se extenderá la vigencia"}
                </span>
                <div className="h-px w-full max-w-[140px] bg-linear-to-r from-transparent via-border to-transparent" />
              </div>

              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4",
                  userPlanStyle.bgColor,
                  userPlanStyle.borderColor,
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    userPlanStyle.bgColor,
                  )}
                >
                  {(() => {
                    const Icon = userPlanStyle.icon
                    return <Icon className={cn("h-5 w-5", userPlanStyle.color)} />
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("font-medium", userPlanStyle.color)}>
                      Plan {getPlanLabel(user.plan)}
                    </p>
                    {extraDays !== null && extraDays > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      >
                        {isExpired ? "" : "+"}
                        {extraDays} {extraDays === 1 ? "día" : "días"}
                        {isExpired ? " de vigencia" : ""}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isExpired ? "Venció el " : "Vence el "}
                    <span
                      className={cn(
                        "font-medium",
                        isExpired ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {format(parseISO(user.plan.expiresAt), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </span>
                    {endDate && newExpiryDate ? (
                      <>
                        {" "}→{" "}
                        <span
                          className={cn(
                            "font-medium",
                            extraDays !== null && extraDays > 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {formatPretty(endDate)}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {mode === "assign" && newPlan && newPlanStyle ? (
            <>
              <div className="flex flex-col items-center gap-2 py-0.5">
                <div className="h-px w-full max-w-[140px] bg-linear-to-r from-transparent via-border to-transparent" />
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    "border border-border bg-card text-primary shadow-sm",
                    "dark:bg-card/80",
                  )}
                >
                  <ArrowDown className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <span className="text-center text-xs font-medium text-muted-foreground">
                  Pasará a este plan
                </span>
                <div className="h-px w-full max-w-[140px] bg-linear-to-r from-transparent via-border to-transparent" />
              </div>

              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4",
                  newPlanStyle.bgColor,
                  newPlanStyle.borderColor,
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    newPlanStyle.bgColor,
                  )}
                >
                  {(() => {
                    const Icon = newPlanStyle.icon
                    return <Icon className={cn("h-5 w-5", newPlanStyle.color)} />
                  })()}
                </div>
                <div className="min-w-0">
                  <p className={cn("font-medium", newPlanStyle.color)}>
                    Plan {newPlan.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nuevo plan a asignar
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {mode === "remove" ? (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">Sin plan</p>
                <p className="text-sm text-muted-foreground">
                  El usuario quedará sin plan asignado
                </p>
              </div>
            </div>
          ) : null}

          {showDateInputs ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-4">
              <div
                className={cn(
                  "grid gap-4 min-w-0",
                  mode === "extend" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2",
                )}
              >
                {mode === "assign" ? (
                  <div className="flex flex-col gap-2 min-w-0">
                    <label
                      htmlFor="start-date"
                      className="text-sm font-medium text-foreground"
                    >
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
                ) : null}
                <div className="flex flex-col gap-2 min-w-0">
                  <label
                    htmlFor="end-date"
                    className="text-sm font-medium text-foreground"
                  >
                    {mode === "extend" ? "Nueva fecha de expiración" : "Fecha de expiración"}
                  </label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    min={minEndDate || undefined}
                    className="bg-background w-full max-w-full"
                  />
                </div>
              </div>

              {showQuickChips ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {mode === "extend"
                      ? isExpired
                        ? "La extensión iniciará hoy (el plan ya estaba vencido)"
                        : "Extender desde el vencimiento actual"
                      : "Atajos desde la fecha de inicio"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_EXTEND_OPTIONS.map((opt) => {
                      const target = baseDateForChips
                        ? addDaysToInput(baseDateForChips, opt.days)
                        : ""
                      const isActive = endDate && target && endDate === target
                      return (
                        <button
                          key={opt.days}
                          type="button"
                          onClick={() => handleQuickChip(opt.days)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                            isActive
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
                          )}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {mode === "extend" && currentExpiry && newExpiryDate && extraDays !== null ? (
                <ExtendTimeline
                  startLabel={
                    user?.plan?.startsAt
                      ? format(parseISO(user.plan.startsAt), "dd MMM", {
                          locale: es,
                        })
                      : "Inicio"
                  }
                  currentExpiryLabel={format(currentExpiry, "dd MMM", {
                    locale: es,
                  })}
                  newExpiryLabel={format(newExpiryDate, "dd MMM yyyy", {
                    locale: es,
                  })}
                  extraDays={extraDays}
                  isExpired={isExpired}
                />
              ) : null}

              {mode === "assign" && totalDaysFromToday !== null && totalDaysFromToday > 0 ? (
                <p className="text-xs text-muted-foreground">
                  El plan estará vigente por{" "}
                  <span className="font-medium text-foreground">
                    {totalDaysFromToday} {totalDaysFromToday === 1 ? "día" : "días"}
                  </span>{" "}
                  desde hoy.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={
              saving ||
              (mode === "assign" && !endDate.trim()) ||
              (mode === "extend" && (!endDate.trim() || (extraDays !== null && extraDays <= 0)))
            }
            className={cn(
              "cursor-pointer",
              mode === "remove" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            )}
          >
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : mode === "extend" ? (
              <>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Extender plan
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

interface ExtendTimelineProps {
  startLabel: string
  currentExpiryLabel: string
  newExpiryLabel: string
  extraDays: number
  isExpired: boolean
}

function ExtendTimeline({
  startLabel,
  currentExpiryLabel,
  newExpiryLabel,
  extraDays,
  isExpired,
}: ExtendTimelineProps) {
  const isExtension = extraDays > 0
  const isShortening = extraDays < 0

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            isExpired ? "bg-destructive/30" : "bg-primary/40",
          )}
          style={{ width: "65%" }}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-[65%] rounded-full",
            isExtension ? "bg-emerald-500/60" : "bg-transparent",
          )}
          style={{ width: "35%" }}
        />
        <span
          className="absolute -top-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary"
          style={{ left: "calc(0% - 6px)" }}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -top-0.5 h-3 w-3 rounded-full border-2 border-card",
            isExpired ? "bg-destructive" : "bg-amber-500",
          )}
          style={{ left: "calc(65% - 6px)" }}
          aria-hidden
        />
        <span
          className={cn(
            "absolute -top-0.5 h-3 w-3 rounded-full border-2 border-card",
            isExtension ? "bg-emerald-500" : "bg-destructive",
          )}
          style={{ left: "calc(100% - 6px)" }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex flex-col">
          <span className="font-medium text-foreground">{startLabel}</span>
          <span>Inicio</span>
        </span>
        <span className="flex flex-col items-center">
          <span
            className={cn(
              "font-medium",
              isExpired
                ? "text-destructive"
                : "text-amber-600 dark:text-amber-400",
            )}
          >
            {currentExpiryLabel}
          </span>
          <span>{isExpired ? "Venció" : "Vencía"}</span>
        </span>
        <span className="flex flex-col items-end">
          <span
            className={cn(
              "font-medium",
              isExtension
                ? "text-emerald-700 dark:text-emerald-400"
                : isShortening
                  ? "text-destructive"
                  : "text-foreground",
            )}
          >
            {newExpiryLabel}
          </span>
          <span>
            {isExtension
              ? isExpired
                ? `Reactiva por ${extraDays} ${extraDays === 1 ? "día" : "días"}`
                : `+${extraDays} ${extraDays === 1 ? "día" : "días"}`
              : isShortening
                ? `${extraDays} días`
                : "sin cambio"}
          </span>
        </span>
      </div>
    </div>
  )
}
