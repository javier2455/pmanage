import { Shield, Sparkles, Crown, type LucideIcon } from "lucide-react";

/**
 * Fuente única de verdad del catálogo de planes (oferta comercial).
 *
 * Consumido por:
 * - La card "Plan activo" del perfil (`/dashboard/profile`).
 * - La página "Cambiar de plan" (`/dashboard/profile/plans-change`).
 *
 * Mantener aquí la lista de funcionalidades garantiza que lo que ve el usuario
 * en su plan activo coincida exactamente con lo que se oferta al cambiar de plan.
 */

export type PlanKey = "free" | "basic" | "pro";

export type PlanFeature = { text: string; included: boolean };

export type PlanCatalogEntry = {
  key: PlanKey;
  /** Etiqueta localizada que se muestra al usuario. */
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  /** Moneda en la que se expresan los precios del catálogo. */
  currency: "USD";
  maxProducts: number;
  maxBusinesses: number;
  icon: LucideIcon;
  features: PlanFeature[];
  /** Advertencia/aviso a mostrar en la card del plan (p. ej. condiciones de la prueba). */
  note?: string;
};

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    key: "free",
    name: "Gratuito",
    description:
      "Prueba todas las funcionalidades del plan Básico sin compromiso.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "USD",
    maxProducts: 100,
    maxBusinesses: 1,
    icon: Shield,
    note: "El plan gratuito está disponible por única vez como prueba (15 días hábiles). Al finalizar debes suscribirte a un plan de pago para seguir usando el sistema.",
    features: [
      { text: "1 negocio", included: true },
      { text: "Hasta 100 productos", included: true },
      { text: "Registro de ventas y compras", included: true },
      { text: "Gestión de gastos con categorías", included: true },
      { text: "Cierre contable diario", included: true },
      { text: "Tasas de cambio multi-moneda", included: true },
      { text: "Historial de precios de productos", included: true },
      { text: "Historial de inventario", included: true },
      { text: "Búsqueda global", included: true },
      { text: "Panel de estadísticas", included: true },
      { text: "Notificaciones por correo", included: false },
      { text: "Cierre contable mensual", included: false },
      { text: "Exportar cierres a Excel/PDF", included: false },
      { text: "Gestión de proveedores", included: false },
      { text: "Gestión de equipo y permisos", included: false },
      { text: "Comparador de precios multi-producto", included: false },
      { text: "Notificaciones por WhatsApp", included: false },
      { text: "Soporte por WhatsApp o correo", included: true },
    ],
  },
  {
    key: "basic",
    name: "Básico",
    description:
      "Ideal para negocios que estan comenzando y necesitan lo esencial.",
    monthlyPrice: 5,
    yearlyPrice: 3,
    currency: "USD",
    maxProducts: 100,
    maxBusinesses: 1,
    icon: Sparkles,
    features: [
      { text: "1 negocio", included: true },
      { text: "Hasta 100 productos", included: true },
      { text: "Registro de ventas y compras", included: true },
      { text: "Gestión de gastos con categorías", included: true },
      { text: "Cierre contable diario", included: true },
      { text: "Tasas de cambio multi-moneda", included: true },
      { text: "Historial de precios de productos", included: true },
      { text: "Historial de inventario", included: true },
      { text: "Búsqueda global", included: true },
      { text: "Panel de estadísticas", included: true },
      { text: "Notificaciones por correo", included: true },
      { text: "Cierre contable mensual", included: false },
      { text: "Exportar cierres a Excel/PDF", included: false },
      { text: "Gestión de proveedores", included: false },
      { text: "Gestión de equipo y permisos", included: false },
      { text: "Comparador de precios multi-producto", included: false },
      { text: "Notificaciones por WhatsApp", included: false },
      { text: "Soporte por WhatsApp o correo", included: true },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "Para negocios en crecimiento que necesitan control total.",
    monthlyPrice: 15,
    yearlyPrice: 12,
    currency: "USD",
    maxProducts: 500,
    maxBusinesses: 3,
    icon: Crown,
    features: [
      { text: "Hasta 3 negocios", included: true },
      { text: "Hasta 500 productos", included: true },
      { text: "Registro de ventas y compras", included: true },
      { text: "Gestión de gastos con categorías", included: true },
      { text: "Cierre contable diario", included: true },
      { text: "Tasas de cambio multi-moneda", included: true },
      { text: "Historial de precios de productos", included: true },
      { text: "Historial de inventario", included: true },
      { text: "Búsqueda global", included: true },
      { text: "Panel de estadísticas", included: true },
      { text: "Notificaciones por correo", included: true },
      { text: "Cierre contable mensual", included: true },
      { text: "Exportar cierres a Excel/PDF", included: true },
      { text: "Gestión de proveedores", included: true },
      { text: "Gestión de equipo y permisos", included: true },
      { text: "Comparador de precios multi-producto", included: true },
      { text: "Notificaciones por WhatsApp", included: true },
      { text: "Soporte prioritario 24/7", included: true },
    ],
  },
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Resuelve el `PlanKey` del catálogo a partir del `type`/`name` crudo del backend.
 * Usa la misma normalización y alias que `getPlanLabel`/`getPlanStyle`.
 */
export function resolvePlanKey(
  plan: { type?: string | null; name?: string | null } | null | undefined,
): PlanKey | null {
  if (!plan) return null;
  const t = normalize((plan.type ?? plan.name ?? "").toString());
  if (!t) return null;
  if (t.includes("free") || t.includes("gratis") || t.includes("gratuito"))
    return "free";
  // "basic" contiene "pro" como subcadena: evaluar básico antes que pro.
  if (t.includes("basico") || t.includes("basic") || t.includes("básico"))
    return "basic";
  if (
    t.includes("pro") ||
    t.includes("profesional") ||
    t.includes("premium") ||
    t.includes("plus")
  )
    return "pro";
  return null;
}

/** Devuelve la entrada del catálogo correspondiente al plan, o null. */
export function getPlanCatalogEntry(
  plan: { type?: string | null; name?: string | null } | null | undefined,
): PlanCatalogEntry | null {
  const key = resolvePlanKey(plan);
  if (!key) return null;
  return PLAN_CATALOG.find((p) => p.key === key) ?? null;
}
