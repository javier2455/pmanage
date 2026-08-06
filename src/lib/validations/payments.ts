import { z } from "zod";

const PAYMENT_METHODS = ["cash", "transfer", "card", "crypto"] as const;

/** Mismo margen que usa el backend para comparar dinero. */
const MARGEN_REDONDEO = 0.01;

/**
 * Schema del formulario de registrar pagos. `availableCurrencies` se conoce en
 * tiempo de render (depende de las tasas del negocio), por eso es una fábrica.
 *
 * `excedenteEsperado` es cuánto entrega el cliente de más, ya convertido a la
 * moneda de la venta por el diálogo (que es quien tiene las tasas). El schema no
 * puede recalcularlo, pero sí comprobar que el vuelto declarado sea coherente
 * con él antes de gastar un request.
 */
export function makePaymentsSchema(
  availableCurrencies: string[],
  excedenteEsperado = 0,
) {
  const currencies =
    availableCurrencies.length > 0 ? availableCurrencies : ["CUP"];

  const moneda = z
    .string()
    .refine((c) => currencies.includes(c), "Moneda no disponible");

  const pago = z.object({
    moneda,
    monto: z
      .number({ message: "El monto es requerido" })
      .positive("El monto debe ser mayor que 0")
      .max(100000000, "El monto es demasiado alto"),
    metodo: z.enum(PAYMENT_METHODS, { message: "Método inválido" }),
    referencia: z.string().trim().max(120).optional().or(z.literal("")),
    excedente: z
      .object({
        vuelto: z
          .object({
            moneda,
            monto: z
              .number({ message: "El vuelto es requerido" })
              .nonnegative("El vuelto no puede ser negativo")
              .max(100000000, "El vuelto es demasiado alto"),
          })
          .optional(),
      })
      .optional(),
  });

  return z
    .object({
      pagos: z.array(pago).min(1, "Agrega al menos un pago"),
    })
    .superRefine((data, ctx) => {
      const conExcedente = data.pagos.filter((p) => p.excedente);

      // El backend rechaza el cobro entero si sobra dinero y nadie dice qué
      // hacer con él; avisamos aquí para no perder el request.
      if (excedenteEsperado > MARGEN_REDONDEO && conExcedente.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["pagos"],
          message:
            "El pago supera lo pendiente. Indica cuánto se devuelve de vuelto.",
        });
        return;
      }

      if (excedenteEsperado <= MARGEN_REDONDEO && conExcedente.length > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["pagos"],
          message: "No hay excedente que repartir en este cobro.",
        });
      }
    });
}

export type PaymentsFormData = z.infer<ReturnType<typeof makePaymentsSchema>>;
