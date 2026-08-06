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

/**
 * Tope del precio de venta, en CUP. Se exporta porque cuando el precio se fija en
 * otra moneda hay que validar el importe **ya convertido** a CUP, no el que se
 * escribió en el campo. Ver docs/moneda-precio-venta.md.
 */
export const MAX_PRODUCT_PRICE = 1000000;

export const createProductInBusinessSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  category: z.string().nullable().optional(),
  unit: z.enum(["kg", "lb", "g", "L", "mL", "ud"]),
  price: z.number().min(1, "El precio es requerido").max(MAX_PRODUCT_PRICE, "El precio máximo es de 1,000,000"),
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
    // Moneda del `entryPrice`. El selector solo ofrece monedas con tasa válida,
    // por eso no validamos contra una lista aquí. `exchangeRateApplied` se
    // computa en el submit, no es campo del formulario. Ver docs/multimoneda-productos.md.
    currency: z.string().optional(),
    // Moneda en la que el usuario TECLEA el precio de venta. No viaja al backend:
    // el formulario convierte a CUP y envía el resultado. Ojo, no confundir con
    // `priceCurrency` del backend, que etiqueta el importe ya guardado y por eso
    // vale siempre CUP. Ver docs/moneda-precio-venta.md.
    priceInputCurrency: z.string().optional(),
    // Cuando es `true`, el backend crea además un gasto de "Reposición de stock"
    // por `entryPrice × stock` en la moneda original. `entryPrice` y `stock` ya son
    // requeridos (`min(1)`), así que la validación condicional del backend se cumple.
    registerAsExpense: z.boolean().optional(),
  });

export const editProductSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  // El producto de catálogo ya no lleva categoría (vive en el BusinessProduct).
  unit: z.enum(["kg", "lb", "g", "L", "mL", "ud"]),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
});

/**
 * Edición de un producto ya asignado a un negocio: precio + categoría.
 * Cada campo viaja a su propio endpoint (ver docs/backend-categoria-business-product.md);
 * el formulario solo envía los que cambiaron.
 */
export const editBusinessProductSchema = z.object({
  price: z
    .number({ error: "Ingresa un precio válido" })
    .positive("El precio debe ser mayor a 0")
    .max(MAX_PRODUCT_PRICE, "El precio máximo es de 1,000,000"),
  // Moneda en la que se teclea el precio; el diálogo convierte a CUP antes de
  // enviarlo, porque el endpoint de precio no acepta moneda (quedó fuera del
  // cambio 148 del backend). Ver docs/moneda-precio-venta.md.
  priceInputCurrency: z.string().optional(),
  categoryId: z.string().nullable().optional(),
});

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type CreateProductInBusinessFormData = z.infer<typeof createProductInBusinessSchema>;
export type AssignProductToBusinessFormData = z.infer<typeof assignProductToBusinessSchema>;
export type EditProductFormData = z.infer<typeof editProductSchema>;
export type EditBusinessProductFormData = z.infer<typeof editBusinessProductSchema>;