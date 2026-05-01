import { z } from "zod";

export const workerFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  phone: z.string().min(1, "Teléfono requerido"),
  email: z.string().email("Correo no válido"),
  job: z.string().min(1, "Indica un cargo"),
});

export type WorkerFormData = z.infer<typeof workerFormSchema>;
