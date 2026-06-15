/**
 * Mapeo entre el rol que entrega `getMe()` y el id con el que el backend
 * etiqueta las secciones/menús del sidebar.
 *
 * `getMe()` devuelve el rol como NOMBRE (p. ej. "admin"), pero el endpoint
 * `/api/v2/section` filtra cada sección/menú por su `roles` usando IDs
 * numéricos en formato string (p. ej. "5"). Aquí traducimos nombre -> id.
 *
 * Nota: los trabajadores de un negocio entran con rol `business_owner` igual
 * que el dueño; se distingue al trabajador por `isWorker: true` en `getMe()`,
 * NO por el rol. `client` queda reservado para uso futuro.
 */
export const ROLE_ID_BY_NAME: Record<string, string> = {
  business_owner: "4",
  admin: "5",
  client: "6",
};

/**
 * Traduce un nombre de rol al id que usan las secciones del sidebar.
 * Devuelve "" si el rol no está mapeado (no coincidirá con ningún `roles`).
 */
export function roleIdFromName(roleName: string): string {
  return ROLE_ID_BY_NAME[roleName.trim().toLowerCase()] ?? "";
}
