import apiClient from "@/lib/axios";
import { supportTicketRoutes } from "../routes/support-ticket";
import type {
  GetSupportNotificationsParams,
  SupportNotificationsResponse,
  UnreadCountResponse,
} from "../types/support-notification";

export async function getSupportNotifications({
  page,
  limit,
  unreadOnly,
}: GetSupportNotificationsParams = {}): Promise<SupportNotificationsResponse> {
  const { data } = await apiClient.get<SupportNotificationsResponse>(
    supportTicketRoutes.myNotifications,
    { params: { page, limit, unreadOnly } },
  );
  return data;
}

export async function getUnreadSupportCount(): Promise<UnreadCountResponse> {
  const { data } = await apiClient.get<UnreadCountResponse>(
    supportTicketRoutes.myNotificationsUnreadCount,
  );
  return data;
}

export async function markSupportNotificationAsRead(
  notificationId: string,
): Promise<void> {
  await apiClient.patch(supportTicketRoutes.markNotificationRead(notificationId));
}

export async function markAllSupportNotificationsAsRead(): Promise<UnreadCountResponse> {
  const { data } = await apiClient.patch<UnreadCountResponse>(
    supportTicketRoutes.markAllNotificationsRead,
    {},
  );
  return data;
}
