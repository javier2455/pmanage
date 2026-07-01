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
}

/** Payload de actualización parcial (PATCH). El backend crea la config al crear el negocio. */
export type UpdateBusinessSettingsPayload = Partial<
  Omit<BusinessSettings, "id">
>;
