import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  category: z.string().min(1, "La categoría es requerida"),
  unit: z.enum(["kg", "lb", "g", "L", "mL ", "ud"]),
  imageUrl: z.string().nullable(),
  price: z.number().min(1, "El precio es requerido").max(1000000, "El precio máximo es de 100,000"),
  stock: z
    .number()
    .min(1, "El monto es requerido")
    .max(100000, "El monto máximo es de 100,000"),
});



export type CreateProductFormData = z.infer<typeof createProductSchema>;