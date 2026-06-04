"use client";

import { useEffect, useState } from "react";
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
import {
  Bell,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Save,
  TriangleAlert,
} from "lucide-react";
import { sileo } from "sileo";
import { isValidPhone } from "@/lib/validations/phone";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import {
  useBusinessSettings,
  useUpdateBusinessSettings,
} from "@/hooks/use-business-settings";
import { Business } from "@/lib/types/business";
import type {
  BusinessSettings,
  NotificationChannel,
  UpdateBusinessSettingsPayload,
} from "@/lib/types/business-settings";

export type NotificationKey =
  | "dailyClose"
  | "monthlyClose"
  | "lowStock"
  | "outOfStock";

type ChannelMatrix = Record<NotificationKey, Record<NotificationChannel, boolean>>;

// En modo oscuro el fondo del checkbox iguala al del contenedor y el borde es
// blanco, para que quede acorde al diseño (en claro se mantiene el estilo base).
const CHECKBOX_DARK = "dark:bg-card dark:border-white";

/** Mapea cada fila de la UI con su campo en el contrato del backend (docs/API.md). */
const FIELD_BY_KEY: Record<NotificationKey, keyof UpdateBusinessSettingsPayload> = {
  dailyClose: "dailyClosingAlert",
  monthlyClose: "monthlyClosingAlert",
  lowStock: "lowStockAlert",
  outOfStock: "outOfStockAlert",
};

const EMPTY_MATRIX: ChannelMatrix = {
  dailyClose: { email: false, sms: false, whatsapp: false },
  monthlyClose: { email: false, sms: false, whatsapp: false },
  lowStock: { email: false, sms: false, whatsapp: false },
  outOfStock: { email: false, sms: false, whatsapp: false },
};

type ChannelConfig = {
  key: NotificationChannel;
  label: string;
  icon: typeof Mail;
  /** Requiere plan PRO (Premium/Enterprise). */
  pro: boolean;
  /** Requiere un teléfono válido asociado al negocio. */
  requiresPhone: boolean;
};

const CHANNELS: ChannelConfig[] = [
  { key: "email", label: "Correo", icon: Mail, pro: false, requiresPhone: false },
  { key: "sms", label: "SMS", icon: MessageSquare, pro: true, requiresPhone: true },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    pro: true,
    requiresPhone: true,
  },
];

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

/** Convierte la respuesta del backend (arrays por alerta) a la matriz de la UI. */
function settingsToMatrix(settings: BusinessSettings): ChannelMatrix {
  const matrix: ChannelMatrix = structuredClone(EMPTY_MATRIX);
  for (const key of Object.keys(FIELD_BY_KEY) as NotificationKey[]) {
    const channels = settings[FIELD_BY_KEY[key] as keyof BusinessSettings] as
      | NotificationChannel[]
      | null;
    if (Array.isArray(channels)) {
      for (const ch of channels) {
        if (ch in matrix[key]) matrix[key][ch] = true;
      }
    }
  }
  return matrix;
}

/**
 * Convierte la matriz de la UI al payload del backend.
 * Una alerta sin canales se envía como `null` (no `[]`), según docs/API.md.
 */
function matrixToPayload(matrix: ChannelMatrix): UpdateBusinessSettingsPayload {
  const payload: UpdateBusinessSettingsPayload = {};
  for (const key of Object.keys(FIELD_BY_KEY) as NotificationKey[]) {
    const enabled = CHANNELS.filter((ch) => matrix[key][ch.key]).map(
      (ch) => ch.key,
    );
    payload[FIELD_BY_KEY[key]] = enabled.length > 0 ? enabled : null;
  }
  return payload;
}

export function NotificationSettingsCard({ business }: { business: Business | null }) {
  const { isProPlan } = useUserRoleAndPlan();
  const businessId = business?.id;

  const { data: settings, isLoading } = useBusinessSettings(businessId);
  const { mutate: saveSettings, isPending } = useUpdateBusinessSettings();

  const [matrix, setMatrix] = useState<ChannelMatrix>(EMPTY_MATRIX);

  // Sincroniza la matriz con la config que llega del backend.
  useEffect(() => {
    if (settings) setMatrix(settingsToMatrix(settings));
  }, [settings]);

  // Gating por canal:
  // - email    → disponible en todos los planes.
  // - sms/whatsapp → requieren PRO (Premium/Enterprise) y un teléfono válido.
  const hasValidPhone = isValidPhone(business?.phone);
  const showPhoneWarning = isProPlan && !hasValidPhone;

  function isChannelDisabled(channel: ChannelConfig): boolean {
    if (channel.pro && !isProPlan) return true;
    if (channel.requiresPhone && !hasValidPhone) return true;
    return false;
  }

  function toggleChannel(key: NotificationKey, channel: NotificationChannel) {
    setMatrix((prev) => ({
      ...prev,
      [key]: { ...prev[key], [channel]: !prev[key][channel] },
    }));
  }

  function handleSave() {
    if (!businessId) return;
    saveSettings(
      { businessId, payload: matrixToPayload(matrix) },
      {
        onSuccess: () =>
          sileo.success({ title: "Preferencias de notificaciones guardadas" }),
        onError: () =>
          sileo.error({ title: "No se pudieron guardar las preferencias" }),
      },
    );
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
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando preferencias…
          </div>
        ) : (
          <>
            {showPhoneWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Para recibir avisos por SMS o WhatsApp necesitas un número de
                  teléfono válido asociado al negocio. Edita el negocio para
                  añadirlo. Mientras tanto, esas vías permanecen deshabilitadas.
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
                    {CHANNELS.map((channel) => {
                      const Icon = channel.icon;
                      return (
                        <span
                          key={channel.key}
                          className={`flex w-20 items-center justify-center gap-1 text-xs font-medium text-muted-foreground ${
                            isChannelDisabled(channel) ? "opacity-50" : ""
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {channel.label}
                          {channel.pro && !isProPlan && (
                            <ProBadge className="ml-0" />
                          )}
                        </span>
                      );
                    })}
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
                          {CHANNELS.map((channel) => {
                            const disabled = isChannelDisabled(channel);
                            return (
                              <div
                                key={channel.key}
                                className={`flex w-20 justify-center ${
                                  disabled ? "opacity-60" : ""
                                }`}
                              >
                                <Checkbox
                                  className={CHECKBOX_DARK}
                                  aria-label={`${item.label} por ${channel.label}`}
                                  checked={matrix[item.key][channel.key]}
                                  disabled={disabled}
                                  onCheckedChange={() =>
                                    toggleChannel(item.key, channel.key)
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                        {item.key === "lowStock" &&
                          CHANNELS.some(
                            (ch) => matrix.lowStock[ch.key],
                          ) && (
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
              <Button onClick={handleSave} disabled={isPending || !businessId}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar preferencias
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
