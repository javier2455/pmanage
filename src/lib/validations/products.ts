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

/**
 * Mínimo de un importe monetario, en CUP. Es la resolución de las columnas
 * `decimal(10,2)` del backend: por debajo, lo que se guardaría es 0.
 *
 * Los campos de dinero solo exigen "> 0" aquí; este mínimo lo comprueba el
 * formulario sobre el importe **ya convertido a CUP**, porque se pueden teclear
 * en divisa y 0,60 USD son ~264 CUP, no 0,60. Mismo criterio que el tope
 * (`MAX_PRODUCT_PRICE`). Ver docs/multimoneda-productos.md.
 */
export const MIN_MONEY_IN_BASE = 0.01;

export const createProductInBusinessSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  category: z.string().nullable().optional(),
  unit: z.enum(["kg", "lb", "g", "L", "mL", "ud"]),
  // "> 0" y no "≥ 1": el importe puede cotizarse en divisa, donde 1 unidad son
  // cientos de CUP. El mínimo real se valida sobre el equivalente en CUP.
  price: z
    .number({ message: "El precio es requerido" })
    .positive("El precio debe ser mayor que 0")
    .max(MAX_PRODUCT_PRICE, "El precio máximo es de 1,000,000"),
  entryPrice: z
    .number({ message: "El costo es requerido" })
    .positive("El costo debe ser mayor que 0")
    .max(MAX_PRODUCT_PRICE, "El costo máximo es de 1,000,000"),
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
    // Categoría nueva escrita en el combobox: viaja como nombre y el backend la
    // registra (find-or-create) al guardar. Excluyente con `categoryId`.
    categoryName: z
      .string()
      .max(255, "El nombre de la categoría máximo es de 255 caracteres")
      .nullable()
      .optional(),
    // Moneda del `entryPrice`. El selector solo ofrece monedas con tasa válida,
    // por eso no validamos contra una lista aquí. `exchangeRateApplied` se
    // computa en el submit, no es campo del formulario. Ver docs/multimoneda-productos.md.
    currency: z.string().optional(),
    // Moneda en la que el usuario TECLEA el precio de venta. No viaja al backend:
    // el formulario convierte a CUP y envía el resultado. Ojo, no confundir con
    // `priceCurrency` del backend, que etiqueta el importe ya guardado y por eso
    // vale siempre CUP. Ver docs/moneda-precio-venta.md.
    priceInputCurrency: z.string().optional(),
    // Sin `registerAsExpense`: el alta individual no crea el gasto de
    // "Reposición de stock" (el endpoint no lo soporta). Pendiente documentado
    // en docs/pendientes-gasto-reposicion-al-asignar.md.
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