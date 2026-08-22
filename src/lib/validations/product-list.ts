import { z } from "zod";

/** Mismos topes que el backend, para fallar antes de la petición. */
export const MAX_PRODUCTS_PER_LIST = 300;
const MAX_TEXT_LENGTH = 1000;

export const productListComposerSchema = z.object({
  productIds: z
    .array(z.string())
    .min(1, "Selecciona al menos un producto")
    .max(
      MAX_PRODUCTS_PER_LIST,
      `No puedes compartir más de ${MAX_PRODUCTS_PER_LIST} productos a la vez`,
    ),
  intro: z
    .string()
    .max(MAX_TEXT_LENGTH, "La introducción es demasiado larga")
    .optional(),
  outro: z
    .string()
    .max(MAX_TEXT_LENGTH, "La nota final es demasiado larga")
    .optional(),
});

export type ProductListComposerData = z.infer<typeof productListComposerSchema>;

export const productListTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Ponle un nombre a la plantilla")
    .max(100, "El nombre no puede exceder 100 caracteres"),
});

export type ProductListTemplateFormData = z.infer<
  typeof productListTemplateSchema
>;
