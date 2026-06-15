/** Eventos que generan una notificación de soporte (ver docs/funtion.md). */
export type SupportNotificationEvent =
  | "ticket_created"
  | "user_replied"
  | "admin_replied"
  | "ticket_closed"
  | "ticket_reopened";

export type SupportNotificationRecipient = "user" | "admin";

/**
 * Notificación in-app de soporte. A diferencia de las notificaciones generales
 * (por negocio), estas son por usuario autenticado y viven en endpoints
 * propios (`/support-tickets/my-notifications`). Ver docs/funtion.md.
 */
export interface SupportNotification {
  id: string;
  ticketId: string;
  messageId: string | null;
  recipientType: SupportNotificationRecipient;
  recipientUserId: string | null;
  recipientEmail: string | null;
  eventType: SupportNotificationEvent;
  channel: "in_app" | "email";
  content: string;
  metadata: Record<string, unknown> | null;
  isSent: boolean;
  sendError: string | null;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface SupportNotificationsResponse {
  data: SupportNotification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  unreadCount?: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface GetSupportNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}
