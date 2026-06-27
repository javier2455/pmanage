import { z } from "zod";

/**
 * Formulario de presupuestos iniciales. El usuario solo establece monto para
 * las monedas que aún no tienen cuenta (el backend rechaza duplicados con
 * "Currency account already exists"). Cada fila aporta `currency` + `amount`;
 * el `amount` `null`/vacío significa "no inicializar esa moneda".
 */
export const initializeBudgetsSchema = z.object({
  budgets: z
    .array(
      z.object({
        currency: z.string().min(1),
        amount: z
          .number({ error: "Ingresa un monto válido" })
          .nonnegative("El monto no puede ser negativo")
          .nullable(),
      }),
    )
    .refine((rows) => rows.some((r) => r.amount != null), {
      message: "Establece el presupuesto de al menos una moneda",
    }),
});

export type InitializeBudgetsFormData = z.infer<typeof initializeBudgetsSchema>;
