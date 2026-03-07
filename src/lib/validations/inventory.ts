import { z } from "zod";

export const inventoryUpdateStockSchema = z.object({
  quantity: z
    .number()
    .min(1, "El monto es requerido")
    .max(100000, "El monto máximo es de 100,000"),
  entryPrice: z.number().min(1, "El precio de entrada es requerido").max(100000, "El precio de entrada máximo es de 100,000"),
  productId: z.string().min(1, "El producto es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
});



export type InventoryUpdateStockFormData = z.infer<typeof inventoryUpdateStockSchema>;