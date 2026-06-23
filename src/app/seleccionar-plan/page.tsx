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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NegoraLogo } from "@/components/brand/negora-logo";
import { PLANS } from "@/lib/plans-data";
import type { BillingPeriod, SelectablePlanType } from "@/lib/types/plans";
import { useSelectPlanMutation } from "@/hooks/use-plans";
import { getMyBusinessesList } from "@/lib/api/business";
import { applySelectedPlanToSession } from "@/lib/plan-session";
import { clearSession } from "@/lib/session";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

/** Solo Básico y Pro son elegibles al terminar el trial (Gratuito era el trial). */
const SELECTABLE = PLANS.filter((p) => p.name === "Básico" || p.name === "Pro");

export default function SelectPlanPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [pendingType, setPendingType] = useState<SelectablePlanType | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const selectPlan = useSelectPlanMutation();

  const { data: businesses = [] } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => getMyBusinessesList(),
  });

  const activeBusinessCount = useMemo(
    () => businesses.filter((b) => b.status !== "archived").length,
    [businesses],
  );

  async function handleSelect(planType: SelectablePlanType) {
    // Bajar a Básico con más de un negocio activo: primero reconciliar.
    if (planType === "basic" && activeBusinessCount > 1) {
      router.push(`/seleccionar-plan/reconciliar?billing=${billingPeriod}`);
      return;
    }

    setPendingType(planType);
    try {
      const res = await selectPlan.mutateAsync({ planType, billingPeriod });
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
        description: `Tu plan ${planType === "pro" ? "Pro" : "Básico"} ya está activo.`,
      });
      router.replace("/dashboard");
    } catch {
      toastError({
        title: "No se pudo cambiar de plan",
        description: "Inténtalo de nuevo en unos momentos.",
      });
    } finally {
      setPendingType(null);
    }
  }

  async function handleLogout() {
    setIsLeaving(true);
    await clearSession();
    router.push("/login");
  }

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

        <div className="grid gap-6 md:grid-cols-2">
          {SELECTABLE.map((plan) => {
            const Icon = plan.icon;
            const isPro = plan.name === "Pro";
            const planType: SelectablePlanType = isPro ? "pro" : "basic";
            const displayPrice =
              billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const isBusy = pendingType === planType || selectPlan.isPending;

            return (
              <Card
                key={plan.name}
                className={cn(
                  "relative flex flex-col transition-all",
                  isPro && "border-2 border-emerald-500 shadow-sm shadow-emerald-500/10",
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
                      <span className="text-sm text-muted-foreground">USD / mes</span>
                    </div>
                    {billingPeriod === "yearly" && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Facturado anualmente (${displayPrice * 12} USD/año)
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
                    onClick={() => handleSelect(planType)}
                    disabled={isBusy || isLeaving}
                    className="w-full cursor-pointer"
                    variant={isPro ? "default" : "outline"}
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
