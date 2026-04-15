import { z } from "zod";

const phoneSchema = z
  .string()
  .refine(
    (val) => !val || /^\+[1-9]\d{6,14}$/.test(val),
    { message: "El número de teléfono no es válido" }
  );

export const addToCartSchema = z.object({
  stock: z
    .number()
    .min(1, "El monto es requerido")
    .max(100000, "El monto máximo es de 100,000"),
  productId: z.string().min(1, "El producto es requerido"),
});

export const createBusinessSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().max(500, "La descripción no puede exceder 500 caracteres").nullable(),
  type: z.enum(["agromarket", "mipyme", "market"], {
    message: "El tipo de negocio es requerido",
  }),
  address: z.string().min(1, "La dirección es requerida").max(200, "La dirección no puede exceder 200 caracteres"),
  phone: phoneSchema.nullable(),
  email: z.string().email("El correo no es válido").nullable().or(z.literal("")),
  municipalityId: z.string().min(1, "La ciudad es requerida"),
  // lat: z.number(),
  // lng: z.number(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().max(500, "La descripción no puede exceder 500 caracteres").optional().or(z.literal("")),
  type: z.enum(["agromarket", "mipyme", "market"], {
    message: "El tipo de negocio es requerido",
  }),
  address: z.string().min(1, "La dirección es requerida").max(200, "La dirección no puede exceder 200 caracteres"),
  phone: phoneSchema.optional().or(z.literal("")),
  email: z.string().email("El correo no es válido").optional().or(z.literal("")),
});

export type AddToCartFormData = z.infer<typeof addToCartSchema>;
export type CreateBusinessFormData = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessFormData = z.infer<typeof updateBusinessSchema>;