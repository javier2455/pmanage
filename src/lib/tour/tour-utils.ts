/**
 * Lógica pura de las guías: rutas, selectores y filtrado por plan/permisos.
 *
 * Sin React ni APIs de navegador a propósito, para que tenga tests. Lo que sí
 * depende del navegador (esperar al DOM, pintar el popover) vive en el motor.
 */

import { withBasePath } from "@/lib/base-path";
import type { PlanFeatureKey } from "@/lib/plan-features";
import { requiredFeatureFor } from "@/lib/pro-gates";
import type { TourDefinition, TourStep } from "@/lib/tour/types";

/**
 * Quita la barra final. `trailingSlash: true` hace que la URL del navegador la
 * lleve, mientras que las rutas del catálogo se escriben sin ella; normalizar
 * los dos lados evita depender de qué devuelve exactamente `usePathname()`.
 */
export function normalizeRoute(route: string): string {
  return route.length > 1 && route.endsWith("/") ? route.slice(0, -1) : route;
}

export function isSameRoute(a: string, b: string): boolean {
  return normalizeRoute(a) === normalizeRoute(b);
}

/**
 * Ruta efectiva de un paso: la suya, o la del último paso anterior que declaró
 * una. Así un tour in-page solo necesita declarar la ruta en su primer paso.
 */
export function routeForStep(
  steps: TourStep[],
  index: number,
  fallback: string,
): string {
  for (let i = Math.min(index, steps.length - 1); i >= 0; i--) {
    const route = steps[i]?.route;
    if (route) return route;
  }
  return fallback;
}

/**
 * Selector del item del menú lateral que apunta a `url`.
 *
 * El menú viene del backend: nombre, icono y orden se configuran desde la
 * gestión de menús, así que anclar por texto o por posición se rompería con
 * cualquier cambio de configuración. La URL, en cambio, es el mismo contrato
 * que ya usan `PRO_ROUTES` y los permisos de sección.
 *
 * `withBasePath` cubre el prefijo de despliegue (el atributo href sí lo lleva,
 * `usePathname` no) y la doble alternativa cubre la barra final. NO se usa
 * `href^=` porque `/dashboard/business/products` es prefijo de
 * `.../products/import` y resaltaría el item equivocado.
 */
export function sidebarItemSelector(url: string): string {
  const href = withBasePath(normalizeRoute(url));
  return `:is([data-sidebar="menu-button"],[data-sidebar="menu-sub-button"]):is([href="${href}"],[href="${href}/"])`;
}

/** Ancla explícita en marcado propio: `<div data-tour="products-toolbar">`. */
export function tourAnchor(name: string): string {
  return `[data-tour="${name}"]`;
}

/** La sección de administración queda fuera de las guías: son para clientes. */
export function isAdminRoute(route: string): boolean {
  return normalizeRoute(route).startsWith("/dashboard/admin");
}

export type TourFilterContext = {
  hasFeature: (key: PlanFeatureKey) => boolean;
  /** `false` para los pasos de menú lateral en móvil (ver `TourStep`). */
  allowsSidebarSteps: boolean;
  /** Permisos de sección del trabajador. El dueño concede todo. */
  isRouteAllowed: (route: string) => boolean;
};

/** ¿El plan concede lo que este paso necesita, explícita o implícitamente? */
function planAllowsStep(step: TourStep, route: string, ctx: TourFilterContext) {
  if (step.feature && !ctx.hasFeature(step.feature)) return false;
  /* La capacidad de la ruta se deriva de `PRO_ROUTES` en vez de fiarnos de que
     el autor del paso la haya declarado: si no, un paso hacia una vista que el
     plan no concede dejaría el tour tirado en el redirect de `RouteGuard`. */
  const routeFeature = requiredFeatureFor(route);
  if (routeFeature && !ctx.hasFeature(routeFeature)) return false;
  return true;
}

/**
 * Deja solo los pasos que este usuario puede recorrer ahora mismo.
 *
 * Se llama UNA vez al arrancar el tour y el resultado se congela: el plan en
 * sesión se reescribe tras cada `/auth/me`, y recalcular en vivo movería los
 * pasos bajo los pies del cursor.
 */
export function filterSteps(
  steps: TourStep[],
  entryRoute: string,
  ctx: TourFilterContext,
): TourStep[] {
  return steps.filter((step, index) => {
    const route = routeForStep(steps, index, entryRoute);
    if (isAdminRoute(route)) return false;
    /* Un paso promocional es lo contrario de los demás: sobra en cuanto el
       plan concede la capacidad de la que venía a hablar. */
    if (step.upsellFor && ctx.hasFeature(step.upsellFor)) return false;
    if (!planAllowsStep(step, route, ctx)) return false;
    if (!ctx.isRouteAllowed(route)) return false;
    if (step.needsSidebar && !ctx.allowsSidebarSteps) return false;
    return true;
  });
}

/** Un tour se ofrece si su entrada es accesible y le queda algún paso. */
export function isTourAvailable(
  tour: TourDefinition,
  ctx: TourFilterContext,
): boolean {
  if (isAdminRoute(tour.entryRoute)) return false;
  if (tour.feature && !ctx.hasFeature(tour.feature)) return false;
  if (!ctx.isRouteAllowed(tour.entryRoute)) return false;
  return filterSteps(tour.steps, tour.entryRoute, ctx).length > 0;
}

/**
 * Tour de sección de la ruta actual, para el botón de ayuda contextual.
 * Gana la entrada más específica: estando en `.../products/create` queremos el
 * tour de crear producto, no el de la lista de productos.
 */
export function sectionTourFor(
  pathname: string,
  tours: TourDefinition[],
): TourDefinition | null {
  const current = normalizeRoute(pathname);
  return (
    tours
      .filter((tour) => tour.kind === "seccion")
      .filter((tour) => isSameRoute(current, tour.entryRoute))
      .sort((a, b) => b.entryRoute.length - a.entryRoute.length)[0] ?? null
  );
}
