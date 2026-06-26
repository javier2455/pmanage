import { z } from "zod";

const rateField = z
    .number({ error: "Debe ser un número" })
    .positive("Debe ser mayor a 0")
    .optional();

export const exchangeRateSchema = z.object({
    USD: rateField,
    EURO: rateField,
    CUP_TRANSFERENCIA: rateField,
    CLASICA: rateField,
    MLC: rateField,
    CAD: rateField,
    GBP: rateField,
    CHF: rateField,
    MXN: rateField,
    JPY: rateField,
});

export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;
