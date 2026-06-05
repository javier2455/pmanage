import apiClient from "@/lib/axios";
import { notificationRoutes } from "../routes/notification";
import type {
  GetNotificationsParams,
  NotificationsResponse,
  UnreadCountResponse,
} from "../types/notification";

/**
 * Capa API de notificaciones internas (in-app).
 * Contrato backend: docs/notificaciones-internas.md.
 */

/** Lista paginada de notificaciones del negocio (orden desc por fecha). */
export async function getNotifications(
  businessId: string,
  params: GetNotificationsParams = {},
): Promise<NotificationsResponse> {
  const { data } = await apiClient.get<NotificationsResponse>(
    notificationRoutes.list(businessId),
    { params },
  );
  return data;
}

/** Conteo liviano de no leídas, para el badge de la campana. */
export async function getUnreadCount(
  businessId: string,
): Promise<UnreadCountResponse> {
  const { data } = await apiClient.get<UnreadCountResponse>(
    notificationRoutes.unreadCount(businessId),
  );
  return data;
}

/** Marca una notificación como leída. */
export async function markAsRead(
  businessId: string,
  notificationId: string,
): Promise<void> {
  await apiClient.patch(notificationRoutes.markRead(businessId, notificationId));
}

/** Marca todas las notificaciones del negocio como leídas. */
export async function markAllAsRead(businessId: string): Promise<void> {
  await apiClient.patch(notificationRoutes.markAllRead(businessId));
}
