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
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
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
  Users,
  Warehouse,
};

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Circle;
  return ICON_MAP[name] ?? Circle;
}
