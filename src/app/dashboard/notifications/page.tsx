"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useBusiness } from "@/context/business-context";
import {
  useNotifications,
  useMarkAllNotificationsAsRead,
} from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import { isVisibleNotificationType } from "@/components/notifications/notification-type-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_LIMIT = 20;

export default function NotificationsPage() {
  const { activeBusinessId } = useBusiness();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useNotifications(
    activeBusinessId ?? undefined,
    { page, limit: DEFAULT_LIMIT },
  );

  const meta = data?.meta;

  // Por ahora solo se muestran algunos tipos (ver VISIBLE_NOTIFICATION_TYPES).
  const visible = useMemo(
    () => (data?.data ?? []).filter((n) => isVisibleNotificationType(n.type)),
    [data],
  );

  const { mutate: markAll, isPending: isMarkingAll } =
    useMarkAllNotificationsAsRead();

  return (
    <section className="flex flex-col gap-6">
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
              Avisos sobre tu inventario, ventas y precios.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            activeBusinessId && markAll({ businessId: activeBusinessId })
          }
          disabled={isMarkingAll || (data?.unreadCount ?? 0) === 0}
        >
          {isMarkingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Marcar todas como leídas
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="default" size="sm">
          Todas
        </Button>
      </div>

      {/* Lista */}
      <div className="rounded-lg border border-border bg-card">
        {isLoading && !data ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando notificaciones…
          </div>
        ) : visible.length === 0 ? (
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
            {visible.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                businessId={activeBusinessId!}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Página {meta.page} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
