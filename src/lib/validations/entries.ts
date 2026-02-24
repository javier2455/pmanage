import { z } from "zod";

export const entriesUpdateStockSchema = z.object({
  quantity: z
    .number()
    .min(1, "El monto es requerido")
    .max(100000, "El monto máximo es de 100,000"),
  productId: z.string().min(1, "El producto es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
});



export type EntriesUpdateStockFormData = z.infer<typeof entriesUpdateStockSchema>;