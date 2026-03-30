"use client"

import { useState, useEffect } from "react"
import { differenceInDays, parseISO, startOfDay } from "date-fns"
import Link from "next/link"

import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { PlanType } from "@/lib/types/plans"
import { getPlanStyle } from "@/components/assign-plans/utils"

interface StoredPlan {
    name?: string
    type?: PlanType
    startDate?: string
    expireDate?: string
    expiresAt?: string
}

export function PlanIndicator() {
    const { state: sidebarState } = useSidebar()
    const [plan, setPlan] = useState<StoredPlan | null>(null)

    useEffect(() => {
        const stored = sessionStorage.getItem("user")
        if (!stored) return
        const parsed = JSON.parse(stored)
        queueMicrotask(() => setPlan(parsed?.plan ?? null))
    }, [])

    const expiryDateStr = plan?.expireDate ?? plan?.expiresAt ?? null

    let daysRemaining = 0
    let totalDays = 1
    let progressPercent = 0

    if (expiryDateStr) {
        const today = startOfDay(new Date())
        const expiry = startOfDay(parseISO(expiryDateStr))
        const start = plan?.startDate ? startOfDay(parseISO(plan.startDate)) : today
        daysRemaining = Math.max(differenceInDays(expiry, today), 0)
        totalDays = Math.max(differenceInDays(expiry, start), 1)
        progressPercent = Math.min(((totalDays - daysRemaining) / totalDays) * 100, 100)
    }

    const show = !!plan && !!expiryDateStr && daysRemaining > 0 && daysRemaining <= 15
    const isUrgent = daysRemaining <= 3
    const canUpgrade = plan?.type === "free" || plan?.type === "basic"
    const planStyle = plan?.type || plan?.name
        ? getPlanStyle({ type: plan?.type, name: plan?.name })
        : null

    if (!show || !planStyle || sidebarState !== "expanded") return null

    return (
        <div className={cn(
            "mx-2 mb-1 rounded-lg border px-3 py-2",
            isUrgent
                ? "border-amber-500/30 bg-amber-500/10"
                : cn(planStyle.borderColor, planStyle.bgColor)
        )}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={cn(
                    "text-xs font-medium",
                    isUrgent ? "text-amber-700 dark:text-amber-300" : planStyle.color
                )}>
                    Plan {plan?.name}
                </span>
                <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    isUrgent
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : cn(planStyle.bgColor, planStyle.color)
                )}>
                    {daysRemaining}d
                </span>
            </div>

            <div className="h-1 w-full overflow-hidden rounded-full bg-sidebar-border">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isUrgent ? "bg-linear-to-r from-amber-400 to-orange-500" : ""
                    )}
                    style={{
                        width: `${100 - progressPercent}%`,
                        backgroundColor: isUrgent ? undefined : (planStyle.style.color ?? "#d97706"),
                    }}
                />
            </div>

            <div className="mt-1 flex items-center justify-between gap-2">
                <p className={cn(
                    "text-[10px]",
                    isUrgent
                        ? "text-amber-600/80 dark:text-amber-400/80"
                        : "text-sidebar-foreground/50"
                )}>
                    {daysRemaining} días restantes
                </p>
                {canUpgrade && (
                    <Link
                        href="/dashboard/profile/plans-change"
                        className={cn(
                            "text-[10px] font-medium underline-offset-2 hover:underline",
                            isUrgent
                                ? "text-amber-600 dark:text-amber-400"
                                : planStyle.color
                        )}
                    >
                        Mejorar plan
                    </Link>
                )}
            </div>
        </div>
    )
}
