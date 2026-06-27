"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthUserData } from "@/hooks/use-auth";
import { getMyBusinessesList } from "@/lib/api/business";
import { setPlanExpiredCookie, setNeedsReconciliationCookie } from "@/lib/cookies";
import { applySelectedPlanToSession } from "@/lib/plan-session";
import { getMaxBusinesses } from "@/lib/pro-gates";

/**
 * Fuente fresca de verdad para el estado del plan. El middleware hace el bloqueo
 * rápido (cookies, sin parpadeo), pero estas pueden quedar obsoletas. Este guard
 * consulta `/auth/me` (y la lista de negocios) y, por orden de prioridad:
 *  - si el plan está vencido o el usuario nunca tuvo plan, siembra la cookie y lo
 *    envía al paywall de selección de plan;
 *  - si el plan está vigente, sincroniza el plan real hacia sessionStorage y la
 *    cookie `user_plan_type` (para que el gating Pro refleje el plan actual sin
 *    re-login) y, si tiene más negocios activos de los que permite su plan, lo
 *    envía a la pantalla de reconciliación para elegir cuál conservar.
 *
 * La desactivación de cuenta tiene prioridad: si el usuario está desactivado,
 * dejamos que `ReactivationGuard` (que envuelve a este) gestione la redirección.
 */
export function PlanGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data } = useAuthUserData();

  // Comparte caché (misma queryKey) con la página de reconciliación y el
  // BusinessProvider; solo se consulta cuando el plan está vigente.
  const { data: businesses } = useQuery({
    queryKey: ["businesses"],
    queryFn: () => getMyBusinessesList(),
    enabled: Boolean(data) && !data?.deactivatedAt && !data?.expiredPlan && !data?.hasNeverHadPlan,
  });

  useEffect(() => {
    if (!data) return;
    // Prioridad de la desactivación: no competir con ReactivationGuard.
    if (data.deactivatedAt) return;

    if (data.expiredPlan || data.hasNeverHadPlan) {
      setPlanExpiredCookie(true);
      router.replace("/seleccionar-plan");
      return;
    }

    // Plan vigente: refrescar el plan real en sesión + cookie (limpia también la
    // cookie de plan vencido) para que el gating Pro no quede obsoleto.
    const planType = data.plan?.type ?? data.plan?.name ?? "";
    applySelectedPlanToSession({
      type: data.plan?.type,
      name: data.plan?.name,
      expireDate: data.plan?.expireDate,
    });

    // Exceso de negocios para el plan: forzar la reconciliación.
    if (businesses) {
      const activeCount = businesses.filter((b) => b.status !== "archived").length;
      if (activeCount > getMaxBusinesses(planType)) {
        setNeedsReconciliationCookie(true);
        router.replace("/seleccionar-plan/reconciliar");
        return;
      }
      setNeedsReconciliationCookie(false);
    }
  }, [data, businesses, router]);

  return <>{children}</>;
}
