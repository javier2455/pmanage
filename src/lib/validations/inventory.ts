import { z } from "zod";

export const inventoryUpdateStockSchema = z.object({
  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "El monto es requerido")
    .max(100000, "El monto máximo es de 100,000"),
  entryPrice: z.number().min(1, "El precio de entrada es requerido").max(100000, "El precio de entrada máximo es de 100,000"),
  productId: z.string().min(1, "El producto es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  providerId: z.string().uuid().nullable().optional(),
});



export type InventoryUpdateStockFormData = z.infer<typeof inventoryUpdateStockSchema>;

/** Configuración del umbral de alerta de stock bajo de un producto (Pro). */
export const stockAlertSchema = z.object({
  threshold: z
    .number({ message: "El umbral debe ser un número" })
    .int("El umbral debe ser un número entero")
    .min(1, "El umbral debe ser al menos 1")
    .max(100000, "El umbral máximo es de 100,000"),
});

export type StockAlertFormData = z.infer<typeof stockAlertSchema>;