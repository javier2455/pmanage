/**
 * Lógica de plan Pro y topes.
 *
 * IMPORTANTE (#21): desde que `/auth/me` expone `plan.isPro` y
 * `plan.limits.maxBusinesses`, el front PREFIERE esos valores del backend (ver
 * `use-user-role-plan.ts`, `plan-guard.tsx`, `login/page.tsx`). Las funciones de
 * este archivo (`isProPlan`, `getMaxBusinesses`, `PLAN_BUSINESS_LIMIT`) quedan
 * como **FALLBACK** para respuestas viejas sin esos campos, y como respaldo del
 * `middleware.ts` (que solo tiene el `planType` de una cookie). `PRO_ROUTES` /
 * `isProRoute` siguen siendo la fuente de verdad de qué rutas son Pro.
 *
 * - Compatible con middleware (server) y hooks (client): sin React ni browser APIs.
 * - Agregar una ruta Pro = agregar 1 entrada a PRO_ROUTES.
 */

import type { PlanFeatureKey } from "@/lib/plan-features";

/** Normaliza un string de plan para comparación (sin tildes, minúsculas). */
function normalizePlan(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Determina si un tipo de plan es Pro. Usada por middleware y hooks. */
export function isProPlan(planType: string | undefined): boolean {
  if (!planType) return false;
  const n = normalizePlan(planType);
  return (
    n.includes("pro") ||
    n.includes("profesional") ||
    n.includes("premium") ||
    n.includes("plus") ||
    n.includes("enterprise")
  );
}

/** Determina si un tipo de plan es el gratuito (free). */
export function isFreePlan(planType: string | undefined): boolean {
  if (!planType) return false;
  const n = normalizePlan(planType);
  return n.includes("free") || n.includes("gratis") || n.includes("gratuito");
}

/**
 * Tope de negocios activos por plan. Pro permite 3; el resto (Básico/Free) 1.
 * Fuente única reutilizada por el switcher, la creación de negocios y la
 * detección de exceso para forzar la reconciliación.
 */
export const PLAN_BUSINESS_LIMIT = { pro: 3, default: 1 } as const;

/** Máximo de negocios activos permitidos según el tipo de plan. */
export function getMaxBusinesses(planType: string | undefined): number {
  return isProPlan(planType) ? PLAN_BUSINESS_LIMIT.pro : PLAN_BUSINESS_LIMIT.default;
}

/**
 * Rutas protegidas por capacidad del plan.
 *
 * Cada entrada define:
 * - `path`:     prefijo de ruta protegido (se evalúa con startsWith)
 * - `feature`:  capacidad que el plan debe conceder para entrar
 * - `redirect`: a dónde redirigir a quien no la tiene
 *
 * Antes la condición era "ser plan Pro". Ahora es "tener esta capacidad", que
 * es lo que permite que un plan nuevo abra una sección sin tocar código. Para
 * los planes que aún no declaran capacidades, `hasFeature` recae en el gate
 * Pro anterior, así que el comportamiento observable no cambia.
 *
 * Consumido por middleware.ts (server) y los guards de cliente.
 */
export const PRO_ROUTES = [
  {
    path: "/dashboard/business/providers",
    feature: "providers",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/business/workers",
    feature: "team",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/accounting-close/monthly",
    feature: "monthlyClose",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/analytics",
    feature: "analytics",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/broadcast/product-list",
    feature: "productListShare",
    redirect: "/dashboard",
  },
] as const satisfies ReadonlyArray<{
  path: string;
  feature: PlanFeatureKey;
  redirect: string;
}>;

/** ¿Esta ruta está detrás de una capacidad del plan? */
export function isProRoute(pathname: string): boolean {
  return PRO_ROUTES.some((r) => pathname.startsWith(r.path));
}

/** Capacidad que exige una ruta, o null si no está protegida. */
export function requiredFeatureFor(pathname: string): PlanFeatureKey | null {
  const match = PRO_ROUTES.find((r) => pathname.startsWith(r.path));
  return match?.feature ?? null;
}

/** Obtiene la URL de redirección para una ruta protegida, o null si no lo está. */
export function getProRedirect(pathname: string): string | null {
  const match = PRO_ROUTES.find((r) => pathname.startsWith(r.path));
  return match?.redirect ?? null;
}
