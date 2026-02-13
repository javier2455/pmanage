import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Ingresa un correo electrónico válido")
    .min(1, "El correo es requerido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Ingresa un correo electrónico válido").min(1, "El correo es requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden",
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;