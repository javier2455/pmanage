import { z } from "zod";
import {
  PERMISSION_MODULES,
  type WorkerRolePreset,
} from "@/lib/types/worker";

const ROLE_PRESET_VALUES: [WorkerRolePreset, ...WorkerRolePreset[]] = [
  "dependiente",
  "contador",
  "almacenero",
  "custom",
];

const permissionEntrySchema = z.object({
  view: z.boolean().optional(),
  create: z.boolean().optional(),
  edit: z.boolean().optional(),
  delete: z.boolean().optional(),
});

const permissionsSchema = z.object(
  PERMISSION_MODULES.reduce<Record<string, z.ZodTypeAny>>((acc, module) => {
    acc[module] = permissionEntrySchema;
    return acc;
  }, {}),
);

export const workerFormSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  email: z
    .string()
    .refine(
      (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      { message: "Correo no válido" },
    ),
  password: z
    .string()
    .refine((value) => value === "" || value.length >= 8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    }),
  rolePreset: z.enum(ROLE_PRESET_VALUES),
  permissions: permissionsSchema,
});

export type WorkerFormData = z.infer<typeof workerFormSchema>;

export function trimToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
