import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  // El producto de catálogo ya no lleva categoría; se asigna al BusinessProduct
  // al añadirlo a un negocio. Ver docs/category.md.
  unit: z.enum(["kg", "lb", "g", "L", "mL", "ud"]),
});

/**
 * Umbral de alerta de stock bajo (feature Pro). Opcional al asignar un producto:
 * `null`/ausente = sin alerta. Se puede ajustar luego desde el inventario.
 */
const stockAlertThresholdField = z
  .number({ message: "El umbral debe ser un número" })
  .int("El umbral debe ser un número entero")
  .min(1, "El umbral debe ser al menos 1")
  .max(100000, "El umbral máximo es de 100,000")
  .nullable()
  .optional();

export const createProductInBusinessSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  category: z.string().nullable().optional(),
  unit: z.enum(["kg", "lb", "g", "L", "mL", "ud"]),
  price: z.number().min(1, "El precio es requerido").max(1000000, "El precio máximo es de 100,000"),
  entryPrice: z.number().min(1, "El precio es requerido").max(1000000, "El precio máximo es de 100,000"),
  stock: z
    .number()
    .min(1, "El monto es requerido")
    .max(100000, "El monto máximo es de 100,000"),
  stockAlertThreshold: stockAlertThresholdField,
});

export const assignProductToBusinessSchema = createProductInBusinessSchema
  .pick({ price: true, entryPrice: true, stock: true, stockAlertThreshold: true })
  .extend({
    productId: z.string().min(1, "Selecciona un producto"),
    // La categoría se asigna al BusinessProduct al asignar el producto al
    // negocio. Opcional. Ver docs/category.md.
    categoryId: z.string().nullable().optional(),
  });

export const editProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  // El producto de catálogo ya no lleva categoría (vive en el BusinessProduct).
  unit: z.enum(["kg", "lb", "g", "L", "mL", "ud"]),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
});

export const updateBusinessProductPriceSchema = z.object({
  price: z
    .number({ error: "Ingresa un precio válido" })
    .positive("El precio debe ser mayor a 0")
    .max(1000000, "El precio máximo es de 1,000,000"),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type CreateProductInBusinessFormData = z.infer<typeof createProductInBusinessSchema>;
export type AssignProductToBusinessFormData = z.infer<typeof assignProductToBusinessSchema>;
export type EditProductFormData = z.infer<typeof editProductSchema>;
export type UpdateBusinessProductPriceFormData = z.infer<typeof updateBusinessProductPriceSchema>;