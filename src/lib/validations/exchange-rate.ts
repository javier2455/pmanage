import { z } from "zod";

export const exchangeRateSchema = z.object({
    USD: z.number({ error: "Debe ser un número" }).positive("Debe ser mayor a 0").optional(),
    EURO: z.number({ error: "Debe ser un número" }).positive("Debe ser mayor a 0").optional(),
    CUP_TRANSFERENCIA: z.number({ error: "Debe ser un número" }).positive("Debe ser mayor a 0").optional(),
});

export type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;
