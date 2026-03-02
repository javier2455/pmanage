import { z } from "zod";

export const createSaleSchema = z.object({
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
  phone: z.string().max(20, "El teléfono no puede exceder 20 caracteres").nullable(),
  email: z.string().email("El correo no es válido").nullable().or(z.literal("")),
  municipalityId: z.string().min(1, "La ciudad es requerida"),
  // lat: z.number(),
  // lng: z.number(),
});

export type CreateSaleFormData = z.infer<typeof createSaleSchema>;
export type CreateBusinessFormData = z.infer<typeof createBusinessSchema>;