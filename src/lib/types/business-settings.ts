/**
 * Configuración de alertas/notificaciones por negocio.
 * Contrato backend: docs/API.md.
 *
 * Cada tipo de alerta es un arreglo de canales habilitados, o `null` para
 * deshabilitarla. Los canales `sms` y `whatsapp` requieren plan PRO.
 */

export type NotificationChannel = "email" | "sms" | "whatsapp";

export interface BusinessSettings {
  id: string;
  dailyClosingAlert: NotificationChannel[] | null;
  monthlyClosingAlert: NotificationChannel[] | null;
  lowStockAlert: NotificationChannel[] | null;
  outOfStockAlert: NotificationChannel[] | null;
  /** Canales para avisar cuando llega una orden de delivery. */
  deliveryOrderChannels: NotificationChannel[] | null;
  /** Canales para avisar cuando la orden de delivery está lista. */
  orderReadyChannels: NotificationChannel[] | null;
}

/** Payload de actualización parcial (PATCH). El backend crea la config al crear el negocio. */
export type UpdateBusinessSettingsPayload = Partial<
  Omit<BusinessSettings, "id">
>;
