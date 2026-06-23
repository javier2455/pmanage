"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUserData } from "@/hooks/use-auth";
import { setPlanExpiredCookie } from "@/lib/cookies";

/**
 * Fuente fresca de verdad para el estado del plan. El middleware hace el bloqueo
 * rápido (cookie `user_plan_expired`, sin parpadeo), pero la cookie puede quedar
 * obsoleta. Este guard consulta `/auth/me` y:
 *  - si el plan está vencido o el usuario nunca tuvo plan, siembra la cookie y lo
 *    envía al paywall de selección de plan;
 *  - si no, limpia una cookie obsoleta para no bloquearlo por error.
 *
 * La desactivación de cuenta tiene prioridad: si el usuario está desactivado,
 * dejamos que `ReactivationGuard` (que envuelve a este) gestione la redirección.
 */
export function PlanGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data } = useAuthUserData();

  useEffect(() => {
    if (!data) return;
    // Prioridad de la desactivación: no competir con ReactivationGuard.
    if (data.deactivatedAt) return;

    if (data.expiredPlan || data.hasNeverHadPlan) {
      setPlanExpiredCookie(true);
      router.replace("/seleccionar-plan");
    } else {
      setPlanExpiredCookie(false);
    }
  }, [data, router]);

  return <>{children}</>;
}
