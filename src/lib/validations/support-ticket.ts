import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(5, "El asunto debe tener al menos 5 caracteres")
    .max(255, "El asunto no puede superar los 255 caracteres"),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(5000, "El mensaje no puede superar los 5000 caracteres"),
  userName: z.string().optional(),
});

export const closeTicketSchema = z.object({
  response: z
    .string()
    .max(5000, "La respuesta no puede superar los 5000 caracteres")
    .optional(),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
export type CloseTicketFormData = z.infer<typeof closeTicketSchema>;
