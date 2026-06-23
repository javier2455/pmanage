import { setAuthCookies, setPlanExpiredCookie } from "@/lib/cookies";

/**
 * Sincroniza el estado de sesión local tras elegir un plan self-service.
 * Actualiza el `plan` guardado en sessionStorage, la cookie `user_plan_type`
 * (que lee el middleware para el gating Pro) y limpia la cookie de plan vencido.
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
        sessionStorage.setItem("user", JSON.stringify(parsed));
      } catch {
        // sesión inválida: la corregirá el siguiente getMe()
      }
    }
  }

  const planType = plan.type ?? plan.name ?? undefined;
  setAuthCookies({ planType });
  setPlanExpiredCookie(false);
}
