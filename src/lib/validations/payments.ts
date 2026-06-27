import { z } from "zod";

const PAYMENT_METHODS = ["cash", "transfer", "card", "crypto"] as const;

/**
 * Schema del formulario de registrar pagos. `availableCurrencies` se conoce en
 * tiempo de render (depende de las tasas del negocio), por eso es una fábrica.
 */
export function makePaymentsSchema(availableCurrencies: string[]) {
  const currencies =
    availableCurrencies.length > 0 ? availableCurrencies : ["CUP"];

  const pago = z.object({
    moneda: z
      .string()
      .refine((c) => currencies.includes(c), "Moneda no disponible"),
    monto: z
      .number({ message: "El monto es requerido" })
      .positive("El monto debe ser mayor que 0")
      .max(100000000, "El monto es demasiado alto"),
    metodo: z.enum(PAYMENT_METHODS, { message: "Método inválido" }),
    referencia: z.string().trim().max(120).optional().or(z.literal("")),
  });

  return z.object({
    pagos: z.array(pago).min(1, "Agrega al menos un pago"),
  });
}

export type PaymentsFormData = z.infer<ReturnType<typeof makePaymentsSchema>>;
