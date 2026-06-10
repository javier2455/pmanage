import { z } from "zod";

export const createProductCategorySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no debe exceder 80 caracteres"),
  description: z
    .string()
    .min(2, "La descripción debe tener al menos 2 caracteres")
    .max(500, "La descripción no debe exceder 500 caracteres"),
});

export const updateProductCategorySchema = createProductCategorySchema
  .pick({ name: true, description: true })
  .partial();

export type CreateProductCategoryFormData = z.infer<
  typeof createProductCategorySchema
>;
export type UpdateProductCategoryFormData = z.infer<
  typeof updateProductCategorySchema
>;
