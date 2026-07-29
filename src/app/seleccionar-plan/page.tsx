"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, LogOut } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NegoraLogo } from "@/components/brand/negora-logo";
import {
  fallbackCatalog,
  planToCatalogEntry,
  selectablePlans,
  type PlanCatalogEntry,
} from "@/lib/plan-catalog";
import type { BillingPeriod, PlanResponse } from "@/lib/types/plans";
import { useSelectPlanMutation } from "@/hooks/use-plans";
import { getAllPlans } from "@/lib/api/plans";
import { getMyBusinessesList } from "@/lib/api/business";
import { applySelectedPlanToSession } from "@/lib/plan-session";
import { clearSession } from "@/lib/session";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function SelectPlanPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const selectPlan = useSelectPlanMutation();

  const { data: businesses = [] } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => getMyBusinessesList(),
  });

  // El catálogo manda: precios y funcionalidades salen del propio plan, no de
  // una lista escrita a mano que puede desviarse de lo que el backend aplica.
  const { data: plansData, isPending: isLoadingPlans, isError } = useQuery({
    queryKey: ["all-plans"],
    queryFn: () => getAllPlans(),
  });

  const catalog = useMemo<PlanCatalogEntry[]>(() => {
    const plans: PlanResponse[] = plansData?.data ?? [];
    // Sin catálogo (backend caído) se recurre al respaldo local: este es el
    // paywall, y una pantalla vacía aquí deja al usuario sin salida.
    if (plans.length === 0) return selectablePlans(fallbackCatalog());
    return selectablePlans(plans.map(planToCatalogEntry)).sort(
      (a, b) => a.tier - b.tier,
    );
  }, [plansData]);

  const activeBusinessCount = useMemo(
    () => businesses.filter((b) => b.status !== "archived").length,
    [businesses],
  );

  async function handleSelect(plan: PlanCatalogEntry) {
    // Si el plan destino no admite los negocios activos, primero hay que
    // decidir cuáles se conservan. Antes esta condición estaba fijada a
    // "bajar a Básico con más de uno"; ahora sale del tope del propio plan.
    const maxBusinesses = plan.maxBusinesses;
    if (maxBusinesses !== null && activeBusinessCount > maxBusinesses) {
      const params = new URLSearchParams({ billing: billingPeriod });
      if (plan.id) params.set("planId", plan.id);
      router.push(`/seleccionar-plan/reconciliar?${params.toString()}`);
      return;
    }

    setPendingCode(plan.code);
    try {
      const res = await selectPlan.mutateAsync({
        // Sin id (catálogo de respaldo) se recae en el tipo, que es lo único
        // que el backend antiguo sabía interpretar.
        ...(plan.id
          ? { planId: plan.id }
          : { planType: plan.isPro ? ("pro" as const) : ("basic" as const) }),
        billingPeriod,
      });
      applySelectedPlanToSession({
        type: res.data?.type,
        name: res.data?.name,
        expireDate: res.data?.expireDate,
      });
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }
      toastSuccess({
        title: "Plan actualizado",
        description: `Tu plan ${plan.name} ya está activo.`,
      });
      router.replace("/dashboard");
    } catch {
      toastError({
        title: "No se pudo cambiar de plan",
        description: "Inténtalo de nuevo en unos momentos.",
      });
    } finally {
      setPendingCode(null);
    }
  }

  async function handleLogout() {
    setIsLeaving(true);
    await clearSession();
    router.push("/login");
  }

  const showSkeleton = isLoadingPlans && !isError;

  return (
    <div className="flex min-h-svh flex-col items-center bg-background px-4 py-12">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <NegoraLogo className="h-12 w-12 rounded-xl" />
          <h1 className="text-2xl font-bold text-foreground">
            Tu período de prueba terminó
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Elige un plan para seguir usando Negora. Tus datos están a salvo: con
            el plan Pro recuperas al instante todos tus negocios y tu equipo.
          </p>
        </div>

        <div className="flex justify-center">
          <Tabs
            value={billingPeriod}
            onValueChange={(value) => setBillingPeriod(value as BillingPeriod)}
          >
            <TabsList>
              <TabsTrigger value="monthly" className="px-6 cursor-pointer">
                Mensual
              </TabsTrigger>
              <TabsTrigger value="yearly" className="px-6 cursor-pointer">
                Anual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {showSkeleton ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-130 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {catalog.map((plan) => {
              const Icon = plan.icon;
              const displayPrice =
                billingPeriod === "monthly"
                  ? plan.monthlyPrice
                  : plan.yearlyPricePerMonth;
              const isBusy = pendingCode === plan.code || selectPlan.isPending;

              return (
                <Card
                  key={plan.code}
                  className={cn(
                    "relative flex flex-col transition-all",
                    plan.isPro &&
                      "border-2 border-emerald-500 shadow-sm shadow-emerald-500/10",
                  )}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl text-card-foreground">
                        {plan.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="mt-2 min-h-10">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col">
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-card-foreground">
                          ${displayPrice}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {plan.currency} / mes
                        </span>
                      </div>
                      {billingPeriod === "yearly" && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Facturado anualmente ({plan.yearlyTotal} {plan.currency}/año)
                        </p>
                      )}
                    </div>

                    <Separator className="mb-4" />

                    <ul className="mb-6 flex flex-1 flex-col gap-2.5">
                      {plan.features
                        .filter((f) => f.included)
                        .map((feature) => (
                          <li key={feature.text} className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                              <Check className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-sm text-card-foreground">
                              {feature.text}
                            </span>
                          </li>
                        ))}
                    </ul>

                    <Button
                      type="button"
                      onClick={() => handleSelect(plan)}
                      disabled={isBusy || isLeaving}
                      className="w-full cursor-pointer"
                      variant={plan.isPro ? "default" : "outline"}
                    >
                      {isBusy ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Procesando…
                        </>
                      ) : (
                        `Elegir ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            disabled={isLeaving || selectPlan.isPending}
            className="cursor-pointer text-muted-foreground"
          >
            {isLeaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Cerrando sesión…
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                Cerrar sesión
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
