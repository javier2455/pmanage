"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBusiness } from "@/context/business-context";
import {
  useNotifications,
  useUnreadCount,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";
import {
  useSupportNotifications,
  useUnreadSupportCount,
  useMarkAllSupportNotificationsAsRead,
} from "@/hooks/use-support-notification";
import { NotificationItem } from "@/components/notifications/notification-item";
import { SupportNotificationItem } from "@/components/notifications/support-notification-item";
import { isVisibleNotificationType } from "@/components/notifications/notification-type-meta";

const RECENT_LIMIT = 5;

/** Item normalizado para fusionar notificaciones generales y de soporte. */
type MergedItem = { key: string; createdAt: string; node: ReactNode };

export function NotificationBell() {
  const { activeBusinessId } = useBusiness();
  const [open, setOpen] = useState(false);

  // Notificaciones generales (por negocio)
  const { data: unread } = useUnreadCount(activeBusinessId ?? undefined);
  const { data: list, isLoading } = useNotifications(
    activeBusinessId ?? undefined,
    { page: 1, limit: RECENT_LIMIT },
  );
  const { mutate: markAll, isPending: isMarkingAll } =
    useMarkAllNotificationsAsRead();

  // Notificaciones de soporte (por usuario)
  const { data: supportUnread } = useUnreadSupportCount();
  const { data: supportList, isLoading: isLoadingSupport } =
    useSupportNotifications({ page: 1, limit: RECENT_LIMIT });
  const { mutate: markAllSupport, isPending: isMarkingAllSupport } =
    useMarkAllSupportNotificationsAsRead();

  const generalUnread = unread?.unreadCount ?? 0;
  const supportUnreadCount = supportUnread?.unreadCount ?? 0;
  const unreadCount = generalUnread + supportUnreadCount;

  const merged: MergedItem[] = [
    ...(list?.data ?? [])
      .filter((n) => isVisibleNotificationType(n.type))
      .map((n) => ({
        key: `gen-${n.id}`,
        createdAt: n.createdAt,
        node: (
          <NotificationItem
            notification={n}
            businessId={activeBusinessId!}
            onAfterClick={() => setOpen(false)}
          />
        ),
      })),
    ...(supportList?.data ?? []).map((n) => ({
      key: `sup-${n.id}`,
      createdAt: n.createdAt,
      node: (
        <SupportNotificationItem
          notification={n}
          onAfterClick={() => setOpen(false)}
        />
      ),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_LIMIT);

  const isAnyLoading = isLoading || isLoadingSupport;
  const isMarking = isMarkingAll || isMarkingAllSupport;

  function handleMarkAll() {
    if (activeBusinessId && generalUnread > 0) {
      markAll({ businessId: activeBusinessId });
    }
    if (supportUnreadCount > 0) {
      markAllSupport();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] leading-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <span className="text-sm font-semibold text-card-foreground">
            Notificaciones
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || isMarking}
          >
            {isMarking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Marcar todas
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto p-1">
          {isAnyLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando…
            </div>
          ) : merged.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-8 text-center">
              <Bell className="h-6 w-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {merged.map((m) => (
                <div key={m.key}>{m.node}</div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border p-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => setOpen(false)}
          >
            <Link href="/dashboard/notifications">Ver todas</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
