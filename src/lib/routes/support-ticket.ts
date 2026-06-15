import { BASIC_ROUTE } from ".";

export const supportTicketRoutes = {
  // Usuario
  create: `${BASIC_ROUTE}/support-tickets`,
  myTickets: `${BASIC_ROUTE}/support-tickets/my-tickets`,
  myTicketById: (id: string) =>
    `${BASIC_ROUTE}/support-tickets/my-tickets/${id}`,
  userReply: (id: string) => `${BASIC_ROUTE}/support-tickets/${id}/messages`,

  // Admin
  all: `${BASIC_ROUTE}/support-tickets`,
  adminReply: (id: string) =>
    `${BASIC_ROUTE}/support-tickets/${id}/admin-messages`,

  // Estado (cerrar/reabrir) — canónico, ambos roles
  updateStatus: (id: string) => `${BASIC_ROUTE}/support-tickets/${id}/status`,

  /** @deprecated Endpoint de compatibilidad para cerrar (admin). */
  close: (id: string) => `${BASIC_ROUTE}/support-tickets/${id}/close`,

  // Notificaciones de soporte (in-app)
  myNotifications: `${BASIC_ROUTE}/support-tickets/my-notifications`,
  myNotificationsUnreadCount: `${BASIC_ROUTE}/support-tickets/my-notifications/unread-count`,
  markNotificationRead: (id: string) =>
    `${BASIC_ROUTE}/support-tickets/my-notifications/${id}/read`,
  markAllNotificationsRead: `${BASIC_ROUTE}/support-tickets/my-notifications/read-all`,
};
