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
  /**
   * Cuando el caller tiene los valores frescos del backend (`/auth/me`), los
   * pasa aquí y se persisten. Si NO los pasa (flujo self-service) y el plan
   * cambió, se descartan los que hubiera guardados para que el gating recaiga
   * en la detección local hasta el próximo `/auth/me`.
   */
  isPro?: boolean;
  limits?: {
    maxBusinesses: number | null;
    maxProducts: number | null;
    maxWorkers: number | null;
  };
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
        if (plan.isPro !== undefined || plan.limits !== undefined) {
          // El caller trae los valores frescos del backend: persistirlos.
          if (plan.isPro !== undefined) parsed.plan.isPro = plan.isPro;
          if (plan.limits !== undefined) parsed.plan.limits = plan.limits;
        } else if (plan.type || plan.name) {
          // Cambió el plan sin valores frescos: descartar los obsoletos.
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
