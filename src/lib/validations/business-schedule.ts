import { z } from "zod";

/**
 * Validación del horario de atención del negocio.
 * Refleja las reglas que valida el backend (docs/funcionalidad.md):
 *
 * - `dayOfWeek` entero entre 0 y 6.
 * - Si el día está abierto, `openTime`/`closeTime` son obligatorios en formato
 *   "HH:mm" (24h con ceros iniciales) y `openTime` debe ser menor que `closeTime`.
 * - Si el día está cerrado, las horas se ignoran.
 *
 * La unicidad de `dayOfWeek` está garantizada por el formulario (7 filas fijas,
 * una por día), por lo que no se valida aquí.
 */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const scheduleDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    openTime: z.string(),
    closeTime: z.string(),
  })
  .superRefine((day, ctx) => {
    if (day.isClosed) return;

    const openOk = HHMM.test(day.openTime);
    const closeOk = HHMM.test(day.closeTime);

    if (!openOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["openTime"],
        message: "Indica la hora de apertura (HH:mm).",
      });
    }
    if (!closeOk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closeTime"],
        message: "Indica la hora de cierre (HH:mm).",
      });
    }
    if (openOk && closeOk && day.openTime >= day.closeTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closeTime"],
        message: "El cierre debe ser posterior a la apertura.",
      });
    }
  });

export const businessScheduleFormSchema = z.object({
  days: z.array(scheduleDaySchema).length(7),
});

export type BusinessScheduleFormData = z.infer<typeof businessScheduleFormSchema>;
