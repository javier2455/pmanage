import { z } from "zod";

/**
 * Categorías del negocio. El mismo esquema sirve para gastos y productos: los
 * dos nomencladores tienen exactamente los mismos campos y reglas, y el
 * formulario (`components/categories/category-form-dialog.tsx`) es uno solo.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no debe exceder 80 caracteres"),
  description: z
    .string()
    .min(2, "La descripción debe tener al menos 2 caracteres")
    .max(500, "La descripción no debe exceder 500 caracteres"),
  businessId: z.string().min(1, "Selecciona un negocio"),
});

export const updateCategorySchema = createCategorySchema
  .pick({ name: true, description: true })
  .partial();

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
