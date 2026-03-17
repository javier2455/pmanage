"use client"

import { useState } from "react"
import { useGetAllUsersData } from "@/hooks/use-user"
import { useGetAllPlans } from "@/hooks/use-plans"
import type { UserDataResponse } from "@/lib/types/user"
import type { PlanResponse } from "@/lib/types/plans"
import { AssignPlansStatsCards } from "@/components/assign-plans/assign-plans-stats-cards"
import { AssignPlansTable } from "@/components/assign-plans/assign-plans-table"
import { AssignPlanConfirmDialog } from "@/components/assign-plans/assign-plan-confirm-dialog"

export default function AssignPlansPage() {
  const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersData()
  const { data: plansData } = useGetAllPlans()

  const users: UserDataResponse[] = usersData ?? []
  const plans = plansData ?? []

  console.log('plans', plans)

  const [searchQuery, setSearchQuery] = useState("")
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    user: UserDataResponse | null
    newPlan: PlanResponse | null
  }>({ open: false, user: null, newPlan: null })
  const [saving, setSaving] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handlePlanSelect = (user: UserDataResponse, plan: PlanResponse | null) => {
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")
    setConfirmDialog({ open: true, user, newPlan: plan })
  }

  const handleConfirm = () => {
    if (!confirmDialog.user) return
    setSaving(true)
    // TODO: llamar API de asignar plan cuando exista
    setSaving(false)
    setConfirmDialog({ open: false, user: null, newPlan: null })
  }

  const handleCancel = () => {
    setConfirmDialog({ open: false, user: null, newPlan: null })
    setStartDate("")
    setEndDate("")
  }

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

      <AssignPlansStatsCards users={users} plans={plans} />

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
        saving={saving}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        plans={plans}
      />
    </div>
  )
}
