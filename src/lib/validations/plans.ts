import { z } from "zod";
import type { PlanType } from "@/lib/types/plans";

export const createPlanSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().max(200, "La descripcion no puede exceder 200 caracteres").optional(),
  type: z.enum(["free", "basic", "premium", "enterprise"] satisfies [PlanType, ...PlanType[]], {
    error: "El tipo es requerido",
  }),
  price: z.number().min(0, "El precio no puede ser negativo").nullable(),
  maxProducts: z.number().min(1, "La cantidad maxima de productos debe ser mayor que 0"),
  isActive: z.boolean(),
});

export type CreatePlanFormInput = z.input<typeof createPlanSchema>;
export type CreatePlanFormData = z.output<typeof createPlanSchema>;
