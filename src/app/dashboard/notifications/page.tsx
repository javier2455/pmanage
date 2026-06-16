"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const DEFAULT_LIMIT = 10;

type NotificationTab = "general" | "support";

/** Item de lista ya renderizado, con su key estable. */
type ListItem = { key: string; node: ReactNode };

export default function NotificationsPage() {
  const { activeBusinessId } = useBusiness();
  const [tab, setTab] = useState<NotificationTab>("general");

  // Cada pestaña mantiene su propia página (paginador independiente).
  const [generalPage, setGeneralPage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);

  // === Generales (por negocio) ===
  const { data, isLoading, isFetching } = useNotifications(
    activeBusinessId ?? undefined,
    { page: generalPage, limit: DEFAULT_LIMIT },
  );
  const { data: generalUnread } = useUnreadCount(activeBusinessId ?? undefined);
  const { mutate: markAll, isPending: isMarkingAll } =
    useMarkAllNotificationsAsRead();

  // === Soporte (por usuario) ===
  const {
    data: supportData,
    isLoading: isLoadingSupport,
    isFetching: isFetchingSupport,
  } = useSupportNotifications({ page: supportPage, limit: DEFAULT_LIMIT });
  const { data: supportUnread } = useUnreadSupportCount();
  const { mutate: markAllSupport, isPending: isMarkingAllSupport } =
    useMarkAllSupportNotificationsAsRead();

  const generalItems: ListItem[] = useMemo(
    () =>
      (data?.data ?? [])
        .filter((n) => isVisibleNotificationType(n.type))
        .map((n) => ({
          key: n.id,
          node: (
            <NotificationItem notification={n} businessId={activeBusinessId!} />
          ),
        })),
    [data, activeBusinessId],
  );

  const supportItems: ListItem[] = useMemo(
    () =>
      (supportData?.data ?? []).map((n) => ({
        key: n.id,
        node: <SupportNotificationItem notification={n} />,
      })),
    [supportData],
  );

  const generalUnreadCount = generalUnread?.unreadCount ?? 0;
  const supportUnreadCount = supportUnread?.unreadCount ?? 0;

  const activeUnread = tab === "general" ? generalUnreadCount : supportUnreadCount;
  const isMarkingActive =
    tab === "general" ? isMarkingAll : isMarkingAllSupport;

  function handleMarkAll() {
    if (tab === "general") {
      if (activeBusinessId && generalUnreadCount > 0) {
        markAll({ businessId: activeBusinessId });
      }
    } else if (supportUnreadCount > 0) {
      markAllSupport();
    }
  }

  return (
    <section className="flex flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Notificaciones
            </h1>
            <p className="text-muted-foreground">
              Avisos sobre tu inventario, ventas, precios y soporte.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleMarkAll}
          disabled={isMarkingActive || activeUnread === 0}
        >
          {isMarkingActive ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Marcar todas como leídas
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as NotificationTab)}>
        <TabsList>
          <TabsTrigger value="general">
            Generales
            {generalUnreadCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none"
              >
                {generalUnreadCount > 99 ? "99+" : generalUnreadCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="support">
            Soporte
            {supportUnreadCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px] leading-none"
              >
                {supportUnreadCount > 99 ? "99+" : supportUnreadCount}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <NotificationsList
            items={generalItems}
            isLoading={isLoading}
            isFetching={isFetching}
            page={generalPage}
            totalPages={data?.meta?.totalPages ?? 1}
            onPageChange={setGeneralPage}
          />
        </TabsContent>

        <TabsContent value="support">
          <NotificationsList
            items={supportItems}
            isLoading={isLoadingSupport}
            isFetching={isFetchingSupport}
            page={supportPage}
            totalPages={supportData?.meta?.totalPages ?? 1}
            onPageChange={setSupportPage}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function NotificationsList({
  items,
  isLoading,
  isFetching,
  page,
  totalPages,
  onPageChange,
}: {
  items: ListItem[];
  isLoading: boolean;
  isFetching: boolean;
  page: number;
  totalPages: number;
  onPageChange: (updater: (prev: number) => number) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-card">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando notificaciones…
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              No tienes notificaciones
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col gap-0.5 p-2",
              isFetching && "opacity-60 transition-opacity",
            )}
          >
            {items.map((m) => (
              <div key={m.key}>{m.node}</div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => onPageChange((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
