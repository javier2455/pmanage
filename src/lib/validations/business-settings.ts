import { z } from "zod";

/**
 * Validación de la configuración de alertas del negocio.
 * Los arrays vacíos se normalizan a `null` antes de enviar (ver docs/API.md):
 * el backend recomienda `null` para deshabilitar, no `[]`.
 */

export const notificationChannelSchema = z.enum(["email", "sms", "whatsapp"]);

const channelsSchema = z.array(notificationChannelSchema).nullable();

export const updateBusinessSettingsSchema = z.object({
  dailyClosingAlert: channelsSchema.optional(),
  monthlyClosingAlert: channelsSchema.optional(),
  lowStockAlert: channelsSchema.optional(),
  outOfStockAlert: channelsSchema.optional(),
});

export type UpdateBusinessSettingsFormData = z.infer<
  typeof updateBusinessSettingsSchema
>;
