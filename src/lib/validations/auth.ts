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
  rolId: z.enum(["4", "5", "6"]).optional(),
  invitationId: z.string().uuid().optional(),
  email: z.string().email("Ingresa un correo electrónico válido").min(1, "El correo es requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden",
});

export const verifySchema = z.object({
  code: z
    .string()
    .length(6, "Ingresa el código completo de 6 dígitos")
    .regex(/^\d{6}$/, "El código debe contener solo números"),
});

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .email("Ingresa un correo electrónico válido")
    .min(1, "El correo es requerido"),
});

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type VerifyFormData = z.infer<typeof verifySchema>;
export type RequestPasswordResetFormData = z.infer<typeof requestPasswordResetSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;