"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/api/notifications";
import type { GetNotificationsParams } from "@/lib/types/notification";

/**
 * Hooks de notificaciones internas (in-app).
 * Contrato backend: docs/notificaciones-internas.md.
 */

export const LIST_KEY = "notifications";
export const UNREAD_KEY = "notifications-unread";

export function useNotifications(
  businessId: string | undefined,
  params: GetNotificationsParams = {},
) {
  return useQuery({
    queryKey: [LIST_KEY, businessId, params],
    queryFn: () => getNotifications(businessId!, params),
    enabled: !!businessId,
    placeholderData: keepPreviousData,
  });
}

/**
 * Conteo de no leídas para el badge. Hace polling cada 60s porque el refetch
 * por foco de ventana está desactivado globalmente (ver query-provider).
 */
export function useUnreadCount(businessId: string | undefined) {
  return useQuery({
    queryKey: [UNREAD_KEY, businessId],
    queryFn: () => getUnreadCount(businessId!),
    enabled: !!businessId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      notificationId,
    }: {
      businessId: string;
      notificationId: string;
    }) => markAsRead(notificationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [LIST_KEY, variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: [UNREAD_KEY, variables.businessId],
      });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ businessId }: { businessId: string }) =>
      markAllAsRead(businessId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [LIST_KEY, variables.businessId],
      });
      queryClient.invalidateQueries({
        queryKey: [UNREAD_KEY, variables.businessId],
      });
    },
  });
}
