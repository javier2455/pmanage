"use client"

import { useCallback, useState } from "react"
import axios from "axios"
import { sileo } from "sileo"
import { useGetAllUsersData } from "@/hooks/use-user"
import { useGetAllPlans, useAssignPlanMutation, useRemoveUserPlanMutation } from "@/hooks/use-plans"
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"
import { AssignPlansStatsCards } from "@/components/assign-plans/assign-plans-stats-cards"
import { AssignPlansTable } from "@/components/assign-plans/assign-plans-table"
import {
  AssignPlanConfirmDialog,
  type AssignPlanDialogMode,
} from "@/components/assign-plans/assign-plan-confirm-dialog"

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
}

const ERROR_TOAST_STYLES = {
  description: "text-[#dc2626]/90! text-[15px]!",
}

/** Devuelve la fecha local del sistema en formato YYYY-MM-DD sin conversión UTC */
function localDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Convierte un string YYYY-MM-DD a ISO con mediodía UTC para evitar desfase de zona horaria */
function toUtcNoon(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`
}

/** Convierte un ISO del backend a YYYY-MM-DD usando la fecha local */
function isoToLocalDate(iso: string): string {
  const d = new Date(iso)
  return localDateString(d)
}

export default function AssignPlansPage() {
  const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersData()
  const { data: plansData } = useGetAllPlans()
  const assignPlanMutation = useAssignPlanMutation()
  const removeUserPlanMutation = useRemoveUserPlanMutation()

  const users: UserDataResponse[] = usersData ?? []
  const plans = plansData?.data ?? []

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    mode: AssignPlanDialogMode
    user: UserDataResponse | null
    newPlan: PlanResponse | null
  }>({ open: false, mode: "assign", user: null, newPlan: null })
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handlePlanSelect = useCallback(
    (user: UserDataResponse, plan: PlanResponse | null) => {
      setStartDate(localDateString(new Date()))
      setEndDate("")
      setConfirmDialog({
        open: true,
        mode: plan ? "assign" : "remove",
        user,
        newPlan: plan,
      })
    },
    [],
  )

  const handleExtendPlan = useCallback(
    (user: UserDataResponse) => {
      if (!user.plan) return
      const planFromList =
        plans.find((p: PlanResponse) => p.id === user.plan!.id) ?? null
      setStartDate(
        user.plan.startsAt
          ? isoToLocalDate(user.plan.startsAt)
          : localDateString(new Date()),
      )
      setEndDate("")
      setConfirmDialog({
        open: true,
        mode: "extend",
        user,
        newPlan: planFromList,
      })
    },
    [plans],
  )

  const handleConfirm = async () => {
    const { user, newPlan, mode } = confirmDialog
    if (!user) return

    if (mode === "remove") {
      try {
        await removeUserPlanMutation.mutateAsync(user.id)
        sileo.success({
          title: "Plan removido",
          fill: "",
          styles: SUCCESS_TOAST_STYLES,
          description: `El plan ${user.plan?.name ?? ""} de ${user.name} se ha removido correctamente.`,
        })
        resetDialog()
      } catch (error) {
        showApiError(error, "Error al remover plan", "No se pudo remover el plan. Intenta de nuevo.")
      }
      return
    }

    if (!endDate.trim()) {
      sileo.error({
        title: "Fecha requerida",
        styles: ERROR_TOAST_STYLES,
        description: "La fecha de expiración es obligatoria.",
      })
      return
    }

    if (mode === "extend") {
      const planId = user.plan?.id ?? newPlan?.id
      if (!planId) return
      const currentExpiresAt = user.plan?.expiresAt
      const todayIso = toUtcNoon(localDateString(new Date()))
      const extendStartDate =
        currentExpiresAt && new Date(currentExpiresAt) > new Date()
          ? currentExpiresAt
          : todayIso
      try {
        await assignPlanMutation.mutateAsync({
          userId: user.id,
          planId,
          startDate: extendStartDate,
          expiresAt: toUtcNoon(endDate),
        })
        sileo.success({
          title: "Plan extendido",
          fill: "",
          styles: SUCCESS_TOAST_STYLES,
          description: `El plan ${user.plan?.name ?? ""} de ${user.name} se ha extendido correctamente.`,
        })
        resetDialog()
      } catch (error) {
        showApiError(error, "Error al extender plan", "No se pudo extender el plan. Intenta de nuevo.")
      }
      return
    }

    if (!newPlan) return
    try {
      await assignPlanMutation.mutateAsync({
        userId: user.id,
        planId: newPlan.id,
        startDate: toUtcNoon(startDate),
        expiresAt: toUtcNoon(endDate),
      })
      sileo.success({
        title: "Plan asignado",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: `El plan ${newPlan.name} se ha asignado correctamente a ${user.name}.`,
      })
      resetDialog()
    } catch (error) {
      showApiError(error, "Error al asignar plan", "No se pudo asignar el plan. Intenta de nuevo.")
    }
  }

  function showApiError(error: unknown, fallbackTitle: string, fallbackMessage: string) {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      sileo.error({
        title: error.response?.data?.error ?? "Error",
        styles: ERROR_TOAST_STYLES,
        description: error.response?.data?.message,
      })
    } else {
      sileo.error({
        title: fallbackTitle,
        styles: ERROR_TOAST_STYLES,
        description: fallbackMessage,
      })
    }
  }

  function resetDialog() {
    setConfirmDialog({ open: false, mode: "assign", user: null, newPlan: null })
    setStartDate("")
    setEndDate("")
  }

  const handleCancel = () => {
    resetDialog()
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-x-hidden p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Asignar Planes
        </h1>
        <p className="text-muted-foreground">
          Administra los planes de suscripcion de los usuarios
        </p>
      </div>

      <AssignPlansStatsCards users={users} plans={plans ?? []} />

      <AssignPlansTable
        users={users}
        plans={plans}
        isLoading={isLoadingUsers}
        onPlanSelect={handlePlanSelect}
        onExtendPlan={handleExtendPlan}
      />

      <AssignPlanConfirmDialog
        open={confirmDialog.open}
        mode={confirmDialog.mode}
        user={confirmDialog.user}
        newPlan={confirmDialog.newPlan}
        saving={assignPlanMutation.isPending || removeUserPlanMutation.isPending}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        plans={plans ?? []}
      />
    </div>
  )
}
