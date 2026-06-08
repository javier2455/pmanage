import { BASIC_ROUTE } from ".";

/**
 * Rutas de notificaciones internas (in-app).
 * El negocio se indica por query param `?businessId=` (no va en el path).
 * Contrato backend: docs/notificaciones-internas.md.
 */
export const notificationRoutes = {
  list: `${BASIC_ROUTE}/notifications`,
  unreadCount: `${BASIC_ROUTE}/notifications/unread-count`,
  markRead: (notificationId: string) =>
    `${BASIC_ROUTE}/notifications/${notificationId}/read`,
  markAllRead: `${BASIC_ROUTE}/notifications/read-all`,
};
