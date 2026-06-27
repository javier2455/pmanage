import { z } from "zod";
import { optionalPhoneSchema } from "@/lib/validations/phone";

export const workerFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: optionalPhoneSchema.optional(),
  email: z.string().email("Correo no válido"),
  job: z.string().min(1, "Indica un cargo"),
});

export type WorkerFormData = z.infer<typeof workerFormSchema>;

export const workerEditFormSchema = z.object({
  job: z.string().min(1, "Indica un cargo"),
});

export type WorkerEditFormData = z.infer<typeof workerEditFormSchema>;
