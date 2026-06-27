import { z } from "zod";

export const createExpenseSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  amount: z
    .number({ error: "Ingresa un monto válido" })
    .positive("El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida"),
  expenseCategoryId: z.string().optional().nullable(),
  // Moneda del gasto. El selector solo ofrece monedas con tasa válida; si se
  // omite, el backend asume CUP. Ver docs/078-expenses-multicurrency-frontend-guide.md.
  currency: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseFormData = z.infer<typeof updateExpenseSchema>;
