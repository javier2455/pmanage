import { z } from "zod";

export const createSaleSchema = z.object({
  stock: z
    .number()
    .min(1, "El monto es requerido")
    .max(100000, "El monto máximo es de 100,000"),
  productId: z.string().min(1, "El producto es requerido"),
});



export type CreateSaleFormData = z.infer<typeof createSaleSchema>;