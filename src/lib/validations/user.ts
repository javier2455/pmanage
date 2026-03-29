import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    password: z
      .union([
        z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
        z.literal(""),
      ])
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.password || data.password === data.confirmPassword,
    { path: ["confirmPassword"], message: "Las contraseñas no coinciden" },
  );

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
