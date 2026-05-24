import { z } from "zod";

export const createExpenseCategorySchema = z.object({
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

export const updateExpenseCategorySchema = createExpenseCategorySchema
  .pick({ name: true, description: true })
  .partial();

export type CreateExpenseCategoryFormData = z.infer<
  typeof createExpenseCategorySchema
>;
export type UpdateExpenseCategoryFormData = z.infer<
  typeof updateExpenseCategorySchema
>;
