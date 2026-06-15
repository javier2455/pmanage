"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  LifeBuoy,
  MessageSquare,
  MessageSquareReply,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkSupportNotificationAsRead } from "@/hooks/use-support-notification";
import type {
  SupportNotification,
  SupportNotificationEvent,
} from "@/lib/types/support-notification";

const EVENT_META: Record<
  SupportNotificationEvent,
  { label: string; icon: LucideIcon }
> = {
  ticket_created: { label: "Nuevo ticket", icon: LifeBuoy },
  user_replied: { label: "El usuario respondió", icon: MessageSquareReply },
  admin_replied: { label: "Soporte respondió", icon: MessageSquare },
  ticket_closed: { label: "Ticket cerrado", icon: CheckCircle2 },
  ticket_reopened: { label: "Ticket reabierto", icon: RotateCcw },
};

function ticketHref(notification: SupportNotification): string {
  const base =
    notification.recipientType === "admin"
      ? "/dashboard/admin/support/details"
      : "/dashboard/support/details";
  return `${base}?id=${notification.ticketId}`;
}

export function SupportNotificationItem({
  notification,
  onAfterClick,
}: {
  notification: SupportNotification;
  onAfterClick?: () => void;
}) {
  const router = useRouter();
  const { mutate: markRead } = useMarkSupportNotificationAsRead();

  const meta = EVENT_META[notification.eventType] ?? {
    label: "Soporte",
    icon: LifeBuoy,
  };
  const Icon = meta.icon;
  const isUnread = notification.readAt === null;

  function handleClick() {
    if (isUnread) markRead(notification.id);
    onAfterClick?.();
    router.push(ticketHref(notification));
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
        <Icon className="h-4 w-4 text-primary" />
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
