import { z } from "zod";
import {
  isValidInstallationCode,
  normalizeInstallationCode,
  PAYMENT_MONTHS_MAX,
  PAYMENT_MONTHS_MIN,
} from "@/lib/desktop-licenses";

/** Alta a mano de una instalación (cliente que paga al instalar sin internet). */
export const createInstallationSchema = z.object({
  installationCode: z
    .string()
    .trim()
    .min(1, "El código de instalación es requerido")
    .refine(
      (value) => isValidInstallationCode(normalizeInstallationCode(value)),
      "El código tiene 16 caracteres: números del 0 al 9 y letras de la A a la F",
    ),
  businessName: z
    .string()
    .trim()
    .min(1, "El nombre del negocio es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres"),
  ownerName: z
    .string()
    .trim()
    .max(255, "El nombre no puede superar los 255 caracteres"),
  ownerPhone: z
    .string()
    .trim()
    .max(30, "El teléfono no puede superar los 30 caracteres"),
  notes: z
    .string()
    .trim()
    .max(2000, "Las notas no pueden superar los 2000 caracteres"),
});

/** Pago de licencia: meses obligatorios; importe, moneda y nota opcionales. */
export const registerPaymentSchema = z.object({
  months: z
    .number({ error: "Indica cuántos meses paga" })
    .int("Los meses deben ser un número entero")
    .min(PAYMENT_MONTHS_MIN, `Mínimo ${PAYMENT_MONTHS_MIN} mes`)
    .max(PAYMENT_MONTHS_MAX, `Máximo ${PAYMENT_MONTHS_MAX} meses`),
  amount: z
    .number({ error: "El importe no es válido" })
    .min(0, "El importe no puede ser negativo")
    .optional(),
  currency: z.string(),
  note: z
    .string()
    .trim()
    .max(500, "La nota no puede superar los 500 caracteres"),
});

export type CreateInstallationFormData = z.infer<typeof createInstallationSchema>;
export type RegisterPaymentFormData = z.infer<typeof registerPaymentSchema>;
