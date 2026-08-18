import { setAuthCookies, setPlanExpiredCookie, setNeedsReconciliationCookie } from "@/lib/cookies";
import type { PlanFeatures } from "@/lib/plan-features";
import { sessionStore } from "@/lib/session-store";

/**
 * Quién quiere enterarse de que el plan en sesión cambió.
 *
 * El almacenamiento del navegador no emite eventos en la MISMA pestaña (solo
 * en las demás), así que sin esto los
 * componentes que ya se renderizaron seguían usando el plan viejo durante toda
 * la vida de la página: al subir de plan, las funciones nuevas no aparecían
 * hasta recargar, y una sesión con capacidades obsoletas no se corregía nunca
 * aunque `/auth/me` ya devolviera las buenas.
 */
const listeners = new Set<() => void>();

/** Suscribe a los cambios del plan en sesión. Devuelve la función de baja. */
export function subscribeToPlanSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Avisa a los suscriptores de que el plan en sesión cambió. */
export function notifyPlanSessionChange(): void {
  for (const listener of listeners) listener();
}

/**
 * Sincroniza el estado de sesión local tras elegir un plan self-service.
 * Actualiza el `plan` guardado en sessionStorage, la cookie `user_plan_type`
 * (que lee el middleware para el gating Pro), limpia la cookie de plan vencido y
 * la de reconciliación pendiente (el `select` ya archivó el excedente).
 * El `PlanGuard` revalidará con `/auth/me` en el próximo render del dashboard.
 */
export function applySelectedPlanToSession(plan: {
  type?: string | null;
  /** Identidad estable del plan; con ella se reconoce el plan en curso. */
  code?: string | null;
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
  /** Capacidades declaradas por el plan; gobiernan el gating por funcionalidad. */
  features?: PlanFeatures | null;
}): void {
  if (typeof window !== "undefined") {
    const stored = sessionStore.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.plan = {
          ...(parsed.plan ?? {}),
          ...(plan.type ? { type: plan.type } : {}),
          ...(plan.code ? { code: plan.code } : {}),
          ...(plan.name ? { name: plan.name } : {}),
          ...(plan.expireDate !== undefined ? { expireDate: plan.expireDate } : {}),
        };
        if (
          plan.isPro !== undefined ||
          plan.limits !== undefined ||
          plan.features !== undefined
        ) {
          // El caller trae los valores frescos del backend: persistirlos.
          if (plan.isPro !== undefined) parsed.plan.isPro = plan.isPro;
          if (plan.limits !== undefined) parsed.plan.limits = plan.limits;
          if (plan.features !== undefined) parsed.plan.features = plan.features;
        } else if (plan.type || plan.name) {
          // Cambió el plan sin valores frescos: descartar los obsoletos. Las
          // capacidades del plan anterior son justo lo que no debe sobrevivir a
          // un cambio de plan.
          delete parsed.plan.isPro;
          delete parsed.plan.limits;
          delete parsed.plan.features;
        }
        sessionStore.setItem("user", JSON.stringify(parsed));
      } catch {
        // sesión inválida: la corregirá el siguiente getMe()
      }
    }
  }

  const planType = plan.type ?? plan.name ?? undefined;
  setAuthCookies({ planType });
  setPlanExpiredCookie(false);
  setNeedsReconciliationCookie(false);

  // Al final: los suscriptores deben leer el estado ya escrito, no el anterior.
  notifyPlanSessionChange();
}
