/**
 * Notificaciones internas (in-app).
 * Contrato backend: docs/notificaciones-internas.md.
 */

export type NotificationType =
  | "out_of_stock"
  | "low_stock"
  | "sale_cancelled"
  | "negative_margin"
  | "expense_alert"
  | "price_changed"
  | "weekly_summary"
  | "monthly_summary"
  | "stale_product"
  | "exchange_rate_stale"
  | "new_worker";

export type NotificationSeverity = "high" | "medium" | "info";

export type NotificationDomain =
  | "inventory"
  | "sales"
  | "finance"
  | "team";

export interface InAppNotification {
  id: string;
  type: NotificationType;
  content: string;
  metadata: Record<string, unknown> | null;
  /** `null` ⇔ no leída. */
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationsResponse {
  data: InAppNotification[];
  meta: NotificationsMeta;
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  unreadOnly?: boolean;
}
