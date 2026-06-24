/**
 * Fuente única de verdad para la lógica de plan Pro.
 *
 * - Compatible con middleware (server) y hooks (client): sin React ni browser APIs.
 * - Agregar una ruta Pro = agregar 1 entrada a PRO_ROUTES.
 */

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
 * Rutas protegidas por plan Pro.
 *
 * Cada entrada define:
 * - `path`:     prefijo de ruta que requiere Pro (se evalúa con startsWith)
 * - `redirect`: a dónde redirigir usuarios free
 *
 * Consumido por middleware.ts (server) y sidebar (client).
 */
export const PRO_ROUTES = [
  {
    path: "/dashboard/business/providers",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/business/workers",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/accounting-close/monthly",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/analytics",
    redirect: "/dashboard",
  },
] as const;

/** ¿Esta ruta está detrás del gate Pro? */
export function isProRoute(pathname: string): boolean {
  return PRO_ROUTES.some((r) => pathname.startsWith(r.path));
}

/** Obtiene la URL de redirección para una ruta Pro, o null si no está gateada. */
export function getProRedirect(pathname: string): string | null {
  const match = PRO_ROUTES.find((r) => pathname.startsWith(r.path));
  return match?.redirect ?? null;
}
