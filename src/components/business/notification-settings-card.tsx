"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ProBadge } from "@/components/ui/pro-badge";
import { Bell, Lock, Mail, MessageCircle, Save, TriangleAlert } from "lucide-react";
import { sileo } from "sileo";
import { isValidPhone } from "@/lib/validations/phone";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { isFreePlan } from "@/lib/pro-gates";
import { Business } from "@/lib/types/business";

export type NotificationKey =
  | "dailyClose"
  | "monthlyClose"
  | "lowStock"
  | "outOfStock";

export type NotificationChannelState = {
  email: boolean;
  whatsapp: boolean;
};

export type NotificationSettings = {
  notifications: Record<NotificationKey, NotificationChannelState>;
};

// En modo oscuro el fondo del checkbox iguala al del contenedor y el borde es
// blanco, para que quede acorde al diseño (en claro se mantiene el estilo base).
const CHECKBOX_DARK = "dark:bg-card dark:border-white";

const DEFAULT_NOTIFICATIONS: Record<NotificationKey, NotificationChannelState> = {
  dailyClose: { email: false, whatsapp: false },
  monthlyClose: { email: false, whatsapp: false },
  lowStock: { email: false, whatsapp: false },
  outOfStock: { email: false, whatsapp: false },
};

type NotificationItem = {
  key: NotificationKey;
  label: string;
  description: string;
};

type NotificationCategory = {
  title: string;
  items: NotificationItem[];
};

const CATEGORIES: NotificationCategory[] = [
  {
    title: "Cierres",
    items: [
      {
        key: "dailyClose",
        label: "Cierre diario",
        description: "Resumen de ventas, gastos y total del día.",
      },
      {
        key: "monthlyClose",
        label: "Cierre mensual",
        description: "Resumen contable del mes.",
      },
    ],
  },
  {
    title: "Stock",
    items: [
      {
        key: "lowStock",
        label: "Stock bajo",
        description: "Aviso cuando un producto se acerca a su umbral.",
      },
      {
        key: "outOfStock",
        label: "Producto agotado",
        description: "Aviso cuando un producto llega a 0 unidades.",
      },
    ],
  },
];

export function NotificationSettingsCard({ business }: { business: Business | null }) {
  const { planType, isProPlan } = useUserRoleAndPlan();
  const [notifications, setNotifications] =
    useState<Record<NotificationKey, NotificationChannelState>>(DEFAULT_NOTIFICATIONS);

  // Gating por plan:
  // - free   → sección bloqueada.
  // - básico → solo correo (WhatsApp bloqueado, badge Pro).
  // - pro    → ambas vías (WhatsApp sujeto a tener teléfono válido).
  const locked = isFreePlan(planType);
  const hasValidPhone = isValidPhone(business?.phone);
  const whatsappLockedByPlan = !isProPlan;
  const whatsappDisabled = whatsappLockedByPlan || !hasValidPhone;
  const showPhoneWarning = isProPlan && !hasValidPhone;

  function toggleChannel(
    key: NotificationKey,
    channel: keyof NotificationChannelState,
  ) {
    setNotifications((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  }

  function handleSave() {
    const payload: NotificationSettings = { notifications };
    // TODO(backend): reemplazar por la mutación cuando el endpoint esté disponible.
    // PUT /business/:id/notification-settings con el payload de abajo.
    console.log("[notification-settings] payload", business?.id, payload);
    sileo.success({ title: "Preferencias de notificaciones guardadas" });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">Notificaciones</CardTitle>
            <CardDescription>
              Marca cada aviso que quieras recibir y por qué vía.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {locked ? (
          // Plan free → sección bloqueada con CTA de mejora de plan.
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-card-foreground">
                Las notificaciones están disponibles desde el plan Básico
              </p>
              <p className="text-xs text-muted-foreground">
                Mejora tu plan para configurar avisos de cierres y stock por
                correo (Básico) y WhatsApp (Pro).
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/profile/plans-change">Mejorar plan</Link>
            </Button>
          </div>
        ) : (
          <>
            {showPhoneWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Para recibir avisos por WhatsApp necesitas un número de teléfono
                  válido asociado al negocio. Edita el negocio para añadirlo.
                  Mientras tanto, la vía de WhatsApp permanece deshabilitada.
                </p>
              </div>
            )}

            {/* Notification categories */}
            <div className="flex flex-col gap-4">
              {CATEGORIES.map((category) => (
                <div
                  key={category.title}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {category.title}
                  </p>

                  {/* Column headers */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1" />
                    <span className="flex w-16 items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      Correo
                    </span>
                    <span
                      className={`flex w-20 items-center justify-center gap-1 text-xs font-medium text-muted-foreground ${
                        whatsappDisabled ? "opacity-50" : ""
                      }`}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                      {whatsappLockedByPlan && <ProBadge className="ml-0" />}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {category.items.map((item) => (
                      <div key={item.key} className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-1 flex-col">
                            <span className="text-sm font-medium text-card-foreground">
                              {item.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          </div>
                          <div className="flex w-16 justify-center">
                            <Checkbox
                              className={CHECKBOX_DARK}
                              aria-label={`${item.label} por correo`}
                              checked={notifications[item.key].email}
                              onCheckedChange={() =>
                                toggleChannel(item.key, "email")
                              }
                            />
                          </div>
                          <div
                            className={`flex w-20 justify-center ${
                              whatsappDisabled ? "opacity-60" : ""
                            }`}
                          >
                            <Checkbox
                              className={CHECKBOX_DARK}
                              aria-label={`${item.label} por WhatsApp`}
                              checked={notifications[item.key].whatsapp}
                              disabled={whatsappDisabled}
                              onCheckedChange={() =>
                                toggleChannel(item.key, "whatsapp")
                              }
                            />
                          </div>
                        </div>
                        {item.key === "lowStock" &&
                          (notifications.lowStock.email ||
                            notifications.lowStock.whatsapp) && (
                            // TODO(backend): deshabilitar la fila cuando no haya productos
                            // con umbral definido (cuando el backend exponga ese conteo/flag).
                            <p className="text-xs text-muted-foreground">
                              Requiere que al menos un producto tenga un umbral
                              definido.
                            </p>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4" />
                Guardar preferencias
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
