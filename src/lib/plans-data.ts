import { Shield, Sparkles, Crown, type LucideIcon } from "lucide-react";

/**
 * Fuente única de los datos de presentación de planes (nombre, precios y
 * features) usada por la comparativa del dashboard y por el paywall de
 * selección de plan. Mantener sincronizado con la landing (`src/app/plans`).
 */

export type PlanFeature = {
  text: string;
  included: boolean;
};

export type PlanCardData = {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: LucideIcon;
  features: PlanFeature[];
};

export const PLANS: PlanCardData[] = [
  {
    name: "Gratuito",
    description: "Prueba todas las funcionalidades del plan Pro sin compromiso.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Shield,
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
    name: "Básico",
    description: "Ideal para negocios que estan comenzando y necesitan lo esencial.",
    monthlyPrice: 5,
    yearlyPrice: 4,
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
    name: "Pro",
    description: "Para negocios en crecimiento que necesitan control total.",
    monthlyPrice: 15,
    yearlyPrice: 12,
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

/** Normaliza un nombre/tipo de plan para comparar (sin tildes, minúsculas). */
export function normalizePlanKey(raw: string | undefined | null): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
