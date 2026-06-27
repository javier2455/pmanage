"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMarkNotificationAsRead } from "@/hooks/use-notifications";
import type { InAppNotification } from "@/lib/types/notification";
import {
  getTypeMeta,
  SEVERITY_ICON_CLASS,
} from "@/components/notifications/notification-type-meta";

type NotificationItemProps = {
  notification: InAppNotification;
  businessId: string;
  /** Se invoca tras el clic (p. ej. para cerrar el popover de la campana). */
  onAfterClick?: () => void;
};

export function NotificationItem({
  notification,
  businessId,
  onAfterClick,
}: NotificationItemProps) {
  const router = useRouter();
  const { mutate: markRead } = useMarkNotificationAsRead();

  const meta = getTypeMeta(notification.type);
  const Icon = meta.icon;
  const isUnread = notification.readAt === null;

  function handleClick() {
    if (isUnread) {
      markRead({ businessId, notificationId: notification.id });
    }
    onAfterClick?.();
    router.push(meta.href(notification.metadata));
  }

  let relativeTime = "";
  try {
    relativeTime = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    relativeTime = "";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
        isUnread && "bg-primary/5",
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className={cn("h-4 w-4", SEVERITY_ICON_CLASS[meta.severity])} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-card-foreground">
            {meta.label}
          </span>
          {isUnread && (
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label="No leída"
            />
          )}
        </div>
        <p className="text-sm text-card-foreground/90 line-clamp-3">
          {notification.content}
        </p>
        {relativeTime && (
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
        )}
      </div>
    </button>
  );
}
