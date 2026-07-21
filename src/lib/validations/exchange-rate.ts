import { z } from "zod";

const rateField = z
    .number({ error: "Debe ser un número" })
    .positive("Debe ser mayor a 0")
    .optional();

// CUP Transferencia es el mismo CUP pero por transferencia bancaria, que cuesta un %
// extra frente al efectivo. En el formulario se captura como RECARGO % (no como el
// factor crudo), y admite 0 (sin recargo); el formulario lo convierte a/desde el
// factor que guarda el backend. Por eso se valida >= 0 en vez de > 0.
const recargoField = z
    .number({ error: "Debe ser un número" })
    .min(0, "El recargo no puede ser negativo")
    .optional();

export const exchangeRateSchema = z.object({
    USD: rateField,
    EURO: rateField,
    CUP_TRANSFERENCIA: recargoField,
    CLASICA: rateField,
    MLC: rateField,
    CAD: rateField,
    GBP: rateField,
    CHF: rateField,
    MXN: rateField,
    JPY: rateField,
});

export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;
