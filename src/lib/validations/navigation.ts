import { z } from "zod";

const baseNodeShape = {
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(80, "El nombre no debe exceder 80 caracteres"),
  icon: z.string().min(1, "Selecciona un icono"),
  roles: z
    .array(z.string())
    .min(1, "Selecciona al menos un rol con acceso"),
};

/**
 * Body de POST /api/v2/menu: { icon, name, badge, url, active, roles }
 * + sectionId que enviamos en el body para indicar la sección padre.
 */
export const createAdminMenuSchema = z.object({
  ...baseNodeShape,
  sectionId: z.string().min(1, "Falta la sección padre"),
  badge: z
    .string()
    .max(30, "El badge no debe exceder 30 caracteres")
    .nullable()
    .optional(),
  url: z
    .string()
    .min(1, "Indica la URL")
    .max(120, "La URL no debe exceder 120 caracteres"),
  active: z.boolean(),
});

export const updateAdminMenuSchema = createAdminMenuSchema
  .omit({ sectionId: true })
  .partial();

/**
 * Body de POST /api/v2/submenu: { icon, name, badge, url, menuId, active, roles }
 */
export const createSubmenuSchema = z.object({
  ...baseNodeShape,
  menuId: z.string().min(1, "Falta el menú padre"),
  badge: z
    .string()
    .max(30, "El badge no debe exceder 30 caracteres")
    .nullable()
    .optional(),
  url: z
    .string()
    .min(1, "Indica la URL")
    .max(120, "La URL no debe exceder 120 caracteres"),
  active: z.boolean(),
});

/**
 * PATCH /api/v2/submenu/{id} acepta `menuId` (cambiar de menú padre).
 */
export const updateSubmenuSchema = createSubmenuSchema.partial();

/**
 * Body de POST /api/v2/section.
 *
 * - `order` debe ser entero > 0 (Navegación reserva el 0 en la BD).
 *   El formulario lo precarga con `max(existingOrders) + 1`.
 * - `badge` y `plans` son opcionales (se envían como `null`/`[]` si vacíos).
 * - `roles` puede ir vacío (a diferencia de menús y submenús): una sección
 *   sin roles asignados queda accesible para todos los roles del sistema.
 */
export const createSectionSchema = z.object({
  ...baseNodeShape,
  roles: z.array(z.string()),
  badge: z
    .string()
    .max(30, "El badge no debe exceder 30 caracteres")
    .nullable()
    .optional(),
  active: z.boolean(),
  order: z
    .number({ message: "El orden debe ser un número" })
    .int("El orden debe ser entero")
    .min(1, "El orden debe ser mayor que 0"),
  plans: z.array(z.string()).nullable().optional(),
});

export const updateSectionSchema = createSectionSchema.partial();

export type CreateSectionFormData = z.infer<typeof createSectionSchema>;
export type UpdateSectionFormData = z.infer<typeof updateSectionSchema>;
export type CreateAdminMenuFormData = z.infer<typeof createAdminMenuSchema>;
export type UpdateAdminMenuFormData = z.infer<typeof updateAdminMenuSchema>;
export type CreateSubmenuFormData = z.infer<typeof createSubmenuSchema>;
export type UpdateSubmenuFormData = z.infer<typeof updateSubmenuSchema>;
