import { z } from "zod";

/**
 * Construye el schema de "ingresar stock". `allowDecimals` depende de la unidad
 * del producto: las unidades enteras (`ud`) exigen enteros; las de peso/volumen
 * (kg, lb, g, L, mL) admiten hasta 3 decimales (p. ej. 0,5 kg). Es una fábrica
 * porque la unidad sólo se conoce al elegir producto, en tiempo de render.
 */
export function makeInventoryUpdateStockSchema(allowDecimals = false) {
  const quantity = allowDecimals
    ? z
        .number({ message: "La cantidad es requerida" })
        .positive("La cantidad debe ser mayor que 0")
        .max(100000, "El monto máximo es de 100,000")
        .refine(
          (n) => Math.abs(n * 1000 - Math.round(n * 1000)) < 1e-9,
          "Máximo 3 decimales",
        )
    : z
        .number()
        .int("La cantidad debe ser un número entero")
        .min(1, "El monto es requerido")
        .max(100000, "El monto máximo es de 100,000");

  return z.object({
    quantity,
    entryPrice: z.number().min(1, "El precio de entrada es requerido").max(1000000, "El precio de entrada máximo es de 1,000,000"),
    productId: z.string().min(1, "El producto es requerido"),
    description: z.string().min(1, "La descripción es requerida"),
    providerId: z.string().uuid().nullable().optional(),
    // Moneda del costo del lote. El selector solo ofrece monedas con tasa válida;
    // `exchangeRateApplied` se computa en el submit. Ver docs/multimoneda-productos.md.
    currency: z.string().optional(),
    // Cuando es `true`, el backend crea además un gasto de "Reposición de stock"
    // por `entryPrice × quantity` en la moneda original. `entryPrice` y `quantity`
    // ya son requeridos, así que la validación condicional del backend se cumple.
    registerAsExpense: z.boolean().optional(),
  });
}

export const inventoryUpdateStockSchema = makeInventoryUpdateStockSchema(false);

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