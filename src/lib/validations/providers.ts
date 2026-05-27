import { z } from "zod";

const optionalEmail = z
  .string()
  .email("Email inválido")
  .nullable()
  .or(z.literal(""))
  .optional();

export const providerProductSchema = z.object({
  productId: z.string().uuid("Selecciona un producto válido"),
  price: z
    .number({ error: "Ingresa un precio válido" })
    .min(0, "El precio no puede ser negativo")
    .optional(),
});

export const createProviderSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "Máximo 255 caracteres"),
  description: z.string().nullable().optional(),
  contactName: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .nullable()
    .optional(),
  email: optionalEmail,
  phone: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .nullable()
    .optional(),
  businessId: z.string().uuid("BusinessId inválido"),
  providerProducts: z.array(providerProductSchema).optional(),
});

export const updateProviderSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "Máximo 255 caracteres")
    .optional(),
  description: z.string().nullable().optional(),
  contactName: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .nullable()
    .optional(),
  email: optionalEmail,
  phone: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .nullable()
    .optional(),
  providerProducts: z.array(providerProductSchema).optional(),
});

export const providerFormSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "Máximo 255 caracteres"),
  description: z.string().nullable().optional(),
  contactName: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .nullable()
    .optional(),
  email: optionalEmail,
  phone: z
    .string()
    .max(50, "Máximo 50 caracteres")
    .nullable()
    .optional(),
  providerProducts: z.array(providerProductSchema).optional(),
});

export type CreateProviderFormData = z.infer<typeof createProviderSchema>;
export type UpdateProviderFormData = z.infer<typeof updateProviderSchema>;
export type ProviderFormData = z.infer<typeof providerFormSchema>;
export type ProviderProductFormData = z.infer<typeof providerProductSchema>;
