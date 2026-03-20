"use client"

import { useState } from "react"
import axios from "axios"
import { sileo } from "sileo"
import { useGetAllUsersData } from "@/hooks/use-user"
import { useGetAllPlans, useAssignPlanMutation } from "@/hooks/use-plans"
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"
import { AssignPlansStatsCards } from "@/components/assign-plans/assign-plans-stats-cards"
import { AssignPlansTable } from "@/components/assign-plans/assign-plans-table"
import { AssignPlanConfirmDialog } from "@/components/assign-plans/assign-plan-confirm-dialog"

export default function AssignPlansPage() {
  const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersData()
  const { data: plansData } = useGetAllPlans()
  const assignPlanMutation = useAssignPlanMutation()

  const users: UserDataResponse[] = usersData ?? []
  const plans = plansData?.data ?? []

  console.log('plans', plans)

  const [searchQuery, setSearchQuery] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    user: UserDataResponse | null
    newPlan: PlanResponse | null
  }>({ open: false, user: null, newPlan: null })
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handlePlanSelect = (user: UserDataResponse, plan: PlanResponse | null) => {
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")
    setConfirmDialog({ open: true, user, newPlan: plan })
  }

  const handleConfirm = async () => {
    const { user, newPlan } = confirmDialog
    if (!user || !newPlan) return
    if (!endDate.trim()) {
      sileo.error({
        title: "Fecha requerida",
        description: "La fecha de expiracion es obligatoria para asignar el plan.",
        styles: {
          title: "text-foreground! text-[16px]! font-bold!",
          description: "text-destructive! text-[15px]!",
        },
      })
      return
    }

    try {
      await assignPlanMutation.mutateAsync({
        userId: user.id,
        planId: newPlan.id,
        startDate,
        expiresAt: endDate,
      })
      sileo.success({
        title: "Plan asignado",
        description: `El plan ${newPlan.name} se ha asignado correctamente a ${user.name}.`,
        styles: {
          title: "text-foreground! text-[16px]! font-bold!",
          description: "text-muted-foreground! text-[15px]!",
        },
      })
      setConfirmDialog({ open: false, user: null, newPlan: null })
      setStartDate("")
      setEndDate("")
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          description: error.response?.data?.message,
          styles: {
            title: "text-foreground! text-[16px]! font-bold!",
            description: "text-destructive! text-[15px]!",
          },
        })
      } else {
        sileo.error({
          title: "Error al asignar plan",
          description: "No se pudo asignar el plan. Intenta de nuevo.",
          styles: {
            title: "text-foreground! text-[16px]! font-bold!",
            description: "text-destructive! text-[15px]!",
          },
        })
      }
    }
  }

  const handleCancel = () => {
    setConfirmDialog({ open: false, user: null, newPlan: null })
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="flex max-w-full flex-col gap-6 overflow-x-hidden p-4">
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onPlanSelect={handlePlanSelect}
      />

      <AssignPlanConfirmDialog
        open={confirmDialog.open}
        user={confirmDialog.user}
        newPlan={confirmDialog.newPlan}
        saving={assignPlanMutation.isPending}
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
