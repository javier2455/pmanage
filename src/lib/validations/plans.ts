import { z } from "zod";
import type { PlanType } from "@/lib/types/plans";
import { PLAN_FEATURE_KEYS } from "@/lib/plan-features";

/**
 * Un tope del plan. Se modela como `número | null` en lugar de "número u
 * omitido" a propósito: `null` significa "sin límite" y el formulario obliga a
 * declararlo marcando la casilla. Cuando el campo simplemente no se enviaba, el
 * backend creaba planes con negocios y trabajadores ilimitados por descuido.
 */
const limitField = (label: string, min: number) =>
  z
    .number({ error: `Indica ${label} o marca "Sin límite"` })
    .int(`${label} debe ser un número entero`)
    .min(min, `${label} debe ser al menos ${min}`)
    .nullable();

const featuresSchema = z.object(
  Object.fromEntries(PLAN_FEATURE_KEYS.map((key) => [key, z.boolean()])) as Record<
    (typeof PLAN_FEATURE_KEYS)[number],
    z.ZodBoolean
  >,
);

export const planFormSchema = z
  .object({
    code: z
      .string()
      .min(2, "El código es requerido")
      .max(50, "El código no puede exceder 50 caracteres")
      .regex(
        /^[a-z0-9][a-z0-9-]*$/,
        "Solo minúsculas, números y guiones, empezando por letra o número",
      ),
    name: z.string().min(1, "El nombre es requerido").max(100),
    description: z
      .string()
      .max(200, "La descripcion no puede exceder 200 caracteres")
      .nullable(),
    type: z.enum(
      ["free", "basic", "premium", "enterprise"] satisfies [PlanType, ...PlanType[]],
      { error: "El tipo es requerido" },
    ),
    tier: z
      .number()
      .int()
      .min(0, "El nivel no puede ser negativo")
      .max(100, "El nivel no puede exceder 100"),
    currency: z
      .string()
      .min(3, "La moneda es requerida")
      .max(10)
      .regex(/^[A-Z]+$/, "Usa el código en mayúsculas, por ejemplo USD"),
    priceMonthly: z
      .number({ error: "El precio mensual es requerido" })
      .min(0, "El precio no puede ser negativo"),
    priceYearly: z
      .number({ error: "El precio anual es requerido" })
      .min(0, "El precio no puede ser negativo"),
    maxProducts: limitField("el máximo de productos", 1),
    maxBusinesses: limitField("el máximo de negocios", 1),
    // 0 es válido: un plan sin equipo es una oferta legítima, no un error.
    maxWorkers: limitField("el máximo de trabajadores", 0),
    features: featuresSchema,
    trialDays: z
      .number()
      .int("Los días de prueba deben ser un número entero")
      .min(0, "Los días de prueba no pueden ser negativos")
      .nullable(),
    isActive: z.boolean(),
    isPublic: z.boolean(),
    displayOrder: z.number().int().min(0, "El orden no puede ser negativo"),
  })
  .refine((data) => data.priceYearly <= data.priceMonthly * 12, {
    // Pagar un año por adelantado nunca debería salir más caro que mes a mes:
    // si ocurre es un cero de más al teclear, no una decisión comercial.
    path: ["priceYearly"],
    message: "El precio anual no puede superar 12 mensualidades",
  })
  .refine((data) => !(data.isPublic && !data.isActive), {
    // Un plan inactivo anunciado en la vitrina es un callejón sin salida: el
    // usuario lo elige y luego no se le puede asignar.
    path: ["isPublic"],
    message: "Un plan inactivo no puede anunciarse en la vitrina",
  });

export type PlanFormInput = z.input<typeof planFormSchema>;
export type PlanFormData = z.output<typeof planFormSchema>;
