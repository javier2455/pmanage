import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeDollarSign,
  CalendarRange,
  CalendarCheck,
  PackageX,
  PackageMinus,
  Receipt,
  Tag,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  NotificationDomain,
  NotificationSeverity,
  NotificationType,
} from "@/lib/types/notification";

/**
 * Fuente única de verdad para la presentación de cada tipo de notificación:
 * icono, etiqueta, severidad (color/orden), dominio (agrupación/filtros) y el
 * destino de navegación (deep-link) a partir de su `metadata`.
 *
 * Contrato backend: docs/notificaciones-internas.md.
 */

export type NotificationTypeMeta = {
  label: string;
  icon: LucideIcon;
  severity: NotificationSeverity;
  domain: NotificationDomain;
  /** Construye el deep-link al hacer clic. `metadata` puede ser null. */
  href: (metadata: Record<string, unknown> | null) => string;
};

const INVENTORY = "/dashboard/business/inventory";
const SALES = "/dashboard/business/sales";
const EXPENSES = "/dashboard/business/expenses";
const PRICE_HISTORY = "/dashboard/business/products/price-history";
const ANALYTICS = "/dashboard/analytics";
const MONTHLY_CLOSE = "/dashboard/accounting-close/monthly";
const EXCHANGE_RATE = "/dashboard/exchange-rate";
const WORKERS = "/dashboard/business/workers";

export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  NotificationTypeMeta
> = {
  out_of_stock: {
    label: "Producto agotado",
    icon: PackageX,
    severity: "high",
    domain: "inventory",
    href: () => INVENTORY,
  },
  low_stock: {
    label: "Stock bajo",
    icon: PackageMinus,
    severity: "high",
    domain: "inventory",
    href: () => INVENTORY,
  },
  stale_product: {
    label: "Producto estancado",
    icon: PackageMinus,
    severity: "medium",
    domain: "inventory",
    href: () => INVENTORY,
  },
  sale_cancelled: {
    label: "Venta cancelada",
    icon: XCircle,
    severity: "high",
    domain: "sales",
    href: () => SALES,
  },
  negative_margin: {
    label: "Margen negativo",
    icon: AlertTriangle,
    severity: "high",
    domain: "sales",
    href: () => SALES,
  },
  expense_alert: {
    label: "Gasto elevado",
    icon: Receipt,
    severity: "medium",
    domain: "finance",
    href: () => EXPENSES,
  },
  price_changed: {
    label: "Cambio de precio",
    icon: Tag,
    severity: "medium",
    domain: "finance",
    href: () => PRICE_HISTORY,
  },
  exchange_rate_stale: {
    label: "Tasa desactualizada",
    icon: ArrowLeftRight,
    severity: "medium",
    domain: "finance",
    href: () => EXCHANGE_RATE,
  },
  weekly_summary: {
    label: "Resumen semanal",
    icon: CalendarRange,
    severity: "info",
    domain: "finance",
    href: () => ANALYTICS,
  },
  monthly_summary: {
    label: "Resumen mensual",
    icon: CalendarCheck,
    severity: "info",
    domain: "finance",
    href: () => MONTHLY_CLOSE,
  },
  new_worker: {
    label: "Nuevo trabajador",
    icon: UserPlus,
    severity: "medium",
    domain: "team",
    href: () => WORKERS,
  },
};

/** Fallback seguro para tipos desconocidos que llegue a enviar el backend. */
export const FALLBACK_TYPE_META: NotificationTypeMeta = {
  label: "Notificación",
  icon: BadgeDollarSign,
  severity: "info",
  domain: "finance",
  href: () => "/dashboard/notifications",
};

export function getTypeMeta(type: string): NotificationTypeMeta {
  return (
    NOTIFICATION_TYPE_META[type as NotificationType] ?? FALLBACK_TYPE_META
  );
}

/**
 * Tipos que se muestran al usuario por ahora. El resto ya está modelado pero se
 * habilitará más adelante; para mostrarlos basta con agregarlos a esta lista.
 */
export const VISIBLE_NOTIFICATION_TYPES: NotificationType[] = [
  "out_of_stock",
  "low_stock",
  "sale_cancelled",
  "price_changed",
];

const VISIBLE_SET = new Set<string>(VISIBLE_NOTIFICATION_TYPES);

export function isVisibleNotificationType(type: string): boolean {
  return VISIBLE_SET.has(type);
}

/** Clases de color del icono/acento según severidad. */
export const SEVERITY_ICON_CLASS: Record<NotificationSeverity, string> = {
  high: "text-destructive",
  medium: "text-amber-600 dark:text-amber-400",
  info: "text-muted-foreground",
};

export const DOMAIN_LABEL: Record<NotificationDomain, string> = {
  inventory: "Inventario",
  sales: "Ventas",
  finance: "Finanzas",
  team: "Equipo",
};
