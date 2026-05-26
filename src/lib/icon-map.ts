import { createElement } from "react";
import {
  ArrowLeftRight,
  BadgeDollarSign,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Circle,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tags,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  ArrowLeftRight,
  BadgeDollarSign,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tags,
  Users,
  Warehouse,
};

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP[name] ?? Circle;
}

/**
 * Componente helper para renderizar un icono por nombre sin caer en la
 * regla `react-hooks/static-components` (que prohíbe asignar el resultado
 * de una función a una variable capitalizada y renderizarla inline).
 */
export function ResolvedIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  return createElement(resolveIcon(name), { className });
}
