import { BASIC_ROUTE } from ".";

/**
 * Rutas de notificaciones internas (in-app).
 * Contrato backend: docs/notificaciones-internas.md.
 */
export const notificationRoutes = {
  list: (businessId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/notifications`,
  unreadCount: (businessId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/notifications/unread-count`,
  markRead: (businessId: string, notificationId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/notifications/${notificationId}/read`,
  markAllRead: (businessId: string) =>
    `${BASIC_ROUTE}/businesses/${businessId}/notifications/read-all`,
};
