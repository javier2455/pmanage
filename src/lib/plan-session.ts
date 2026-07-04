import { setAuthCookies, setPlanExpiredCookie, setNeedsReconciliationCookie } from "@/lib/cookies";

/**
 * Sincroniza el estado de sesión local tras elegir un plan self-service.
 * Actualiza el `plan` guardado en sessionStorage, la cookie `user_plan_type`
 * (que lee el middleware para el gating Pro), limpia la cookie de plan vencido y
 * la de reconciliación pendiente (el `select` ya archivó el excedente).
 * El `PlanGuard` revalidará con `/auth/me` en el próximo render del dashboard.
 */
export function applySelectedPlanToSession(plan: {
  type?: string | null;
  name?: string | null;
  expireDate?: string | null;
}): void {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.plan = {
          ...(parsed.plan ?? {}),
          ...(plan.type ? { type: plan.type } : {}),
          ...(plan.name ? { name: plan.name } : {}),
          ...(plan.expireDate !== undefined ? { expireDate: plan.expireDate } : {}),
        };
        // El plan cambió: descartamos el `isPro`/`limits` del backend (que eran
        // del plan anterior) para que el gating recaiga en la detección local
        // por nombre hasta que el próximo /auth/me traiga los valores frescos.
        if (plan.type || plan.name) {
          delete parsed.plan.isPro;
          delete parsed.plan.limits;
        }
        sessionStorage.setItem("user", JSON.stringify(parsed));
      } catch {
        // sesión inválida: la corregirá el siguiente getMe()
      }
    }
  }

  const planType = plan.type ?? plan.name ?? undefined;
  setAuthCookies({ planType });
  setPlanExpiredCookie(false);
  setNeedsReconciliationCookie(false);
}
