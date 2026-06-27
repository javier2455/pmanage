import { z } from "zod";

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(1, "El asunto es requerido")
    .max(255, "El asunto no puede superar los 255 caracteres"),
  message: z
    .string()
    .min(1, "El mensaje es requerido")
    .max(5000, "El mensaje no puede superar los 5000 caracteres"),
  userName: z.string().optional(),
});

/** Respuesta en la conversación (usuario o admin): requerida, máx. 5000 chars. */
export const replyMessageSchema = z.object({
  message: z
    .string()
    .min(1, "El mensaje es requerido")
    .max(5000, "El mensaje no puede superar los 5000 caracteres"),
});

/** Mensaje opcional al cerrar/reabrir un ticket: 0–5000 chars. */
export const statusMessageSchema = z.object({
  message: z
    .string()
    .max(5000, "El mensaje no puede superar los 5000 caracteres")
    .optional(),
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
export type ReplyMessageFormData = z.infer<typeof replyMessageSchema>;
export type StatusMessageFormData = z.infer<typeof statusMessageSchema>;
