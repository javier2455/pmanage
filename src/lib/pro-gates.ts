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
    .toLowerCase()
}

/** Determina si un tipo de plan es Pro. Usada por middleware y hooks. */
export function isProPlan(planType: string | undefined): boolean {
  if (!planType) return false
  const n = normalizePlan(planType)
  return (
    n.includes("pro") ||
    n.includes("profesional") ||
    n.includes("premium") ||
    n.includes("plus")
  )
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
    path: "/dashboard/accounting-close/monthly",
    redirect: "/dashboard",
  },
  {
    path: "/dashboard/analytics",
    redirect: "/dashboard",
  },
] as const

/** ¿Esta ruta está detrás del gate Pro? */
export function isProRoute(pathname: string): boolean {
  return PRO_ROUTES.some((r) => pathname.startsWith(r.path))
}

/** Obtiene la URL de redirección para una ruta Pro, o null si no está gateada. */
export function getProRedirect(pathname: string): string | null {
  const match = PRO_ROUTES.find((r) => pathname.startsWith(r.path))
  return match?.redirect ?? null
}
