"use client"

import { useSyncExternalStore } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  History,
  ArrowLeft,
  Crown,
  Calendar,
  Clock,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Receipt,
} from "lucide-react"
import Link from "next/link"
import { useGetUserPlanHistory } from "@/hooks/use-plans"
import type { PlanHistoryResponse } from "@/lib/types/plans"
import { getPlanLabel } from "@/components/assign-plans/utils"

function PlanHistorySkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-7 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function getPlanBadgeStyles(type: string) {
  switch (type) {
    case "premium":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0"
    case "enterprise":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0"
    case "basic":
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0"
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0"
  }
}


function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge className="gap-1 border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Activo
      </Badge>
    )
  }
  return (
    <Badge className="gap-1 border-0 bg-slate-500/10 text-slate-500 dark:text-slate-400">
      <XCircle className="h-3 w-3" />
      Finalizado
    </Badge>
  )
}

function PlanHistoryContent({ history }: { history: PlanHistoryResponse[] }) {
  const totalSpent = history.reduce((acc, item) => acc + parseFloat(String(item.price)), 0)
  const totalPlans = history.length
  const activePlan = history.find((item) => item.isActive)

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header con navegacion */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/profile"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Historial de planes
            </h1>
            <p className="text-muted-foreground">
              Revisa todos los planes que has tenido en tu cuenta
            </p>
          </div>
        </div>
      </div>

      {/* Cards de estadisticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de planes</p>
              <p className="text-2xl font-bold text-card-foreground">{totalPlans}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total invertido</p>
              <p className="text-2xl font-bold text-card-foreground">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <TrendingUp className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan actual</p>
              <p className="text-2xl font-bold text-card-foreground">
                {activePlan?.plan ? getPlanLabel(activePlan.plan) : "Sin plan"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de planes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <History className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-card-foreground">
                Historial completo
              </CardTitle>
              <CardDescription>
                Todos tus planes ordenados por fecha
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute bottom-0 left-6 top-0 w-px bg-border" />

            <div className="flex flex-col gap-6">
              {history.map((item) => (
                <div key={item.id} className="relative flex gap-4">
                  {/* Punto del timeline */}
                  <div
                    className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${
                      item.isActive
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border bg-card"
                    }`}
                  >
                    <Crown
                      className={`h-5 w-5 ${
                        item.isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>

                  {/* Contenido del plan */}
                  <div
                    className={`flex-1 rounded-xl border p-5 transition-colors ${
                      item.isActive
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    {/* Header del plan */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-card-foreground">
                            {getPlanLabel(item.plan)}
                          </h3>
                          <Badge className={getPlanBadgeStyles(item.plan.type)}>
                            {getPlanLabel({ type: item.plan.type })}
                          </Badge>
                          <StatusBadge isActive={item.isActive} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.plan.description}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-baseline gap-1">
                        <span className="text-2xl font-bold text-card-foreground">
                          ${parseFloat(String(item.price)).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground">CUP</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Detalles del plan */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            Max. productos
                          </span>
                          <span className="text-sm font-medium text-card-foreground">
                            {item.plan.maxProducts}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            Fecha inicio
                          </span>
                          <span className="text-sm font-medium text-card-foreground">
                            {formatDate(item.startsAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            Fecha expiración
                          </span>
                          <span className="text-sm font-medium text-card-foreground">
                            {formatDate(item.expiresAt)}
                          </span>
                        </div>
                      </div>

                      {/* <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">
                            Contratado
                          </span>
                          <span className="text-sm font-medium text-card-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PlanHistoryPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const { data, isLoading, isError } = useGetUserPlanHistory()

  if (!mounted || isLoading) {
    return <PlanHistorySkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/profile"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Historial de planes
            </h1>
            <p className="text-muted-foreground">
              Error al cargar el historial de planes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const history = Array.isArray(data) ? data : (((data as unknown) as { data?: PlanHistoryResponse[] })?.data ?? [])

  return <PlanHistoryContent history={history} />
}
