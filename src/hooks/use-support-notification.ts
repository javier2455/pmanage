import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getSupportNotifications,
  getUnreadSupportCount,
  markAllSupportNotificationsAsRead,
  markSupportNotificationAsRead,
} from "@/lib/api/support-notification";
import type { GetSupportNotificationsParams } from "@/lib/types/support-notification";

export const SUPPORT_NOTIF_LIST_KEY = "support-notifications";
export const SUPPORT_NOTIF_UNREAD_KEY = "support-notifications-unread";

export function useSupportNotifications(
  params: GetSupportNotificationsParams = {},
) {
  return useQuery({
    queryKey: [SUPPORT_NOTIF_LIST_KEY, params],
    queryFn: () => getSupportNotifications(params),
    placeholderData: keepPreviousData,
  });
}

export function useUnreadSupportCount() {
  return useQuery({
    queryKey: [SUPPORT_NOTIF_UNREAD_KEY],
    queryFn: () => getUnreadSupportCount(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkSupportNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      markSupportNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPORT_NOTIF_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUPPORT_NOTIF_UNREAD_KEY] });
    },
  });
}

export function useMarkAllSupportNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllSupportNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUPPORT_NOTIF_LIST_KEY] });
      queryClient.invalidateQueries({ queryKey: [SUPPORT_NOTIF_UNREAD_KEY] });
    },
  });
}
