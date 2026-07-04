/**
 * FALLBACK (#21): mapeo local nombre de rol -> id de sección.
 *
 * Desde #21, `/auth/me` devuelve directamente `roleId` numérico y el front lo
 * PREFIERE (ver `use-user-role-plan.ts` y `login/page.tsx`). Esta tabla queda
 * SOLO como respaldo por si una respuesta vieja de `/auth/me` no trae `roleId`.
 * Una vez desplegado y verificado el backend, se puede eliminar.
 *
 * Contexto: `/api/v2/section` filtra cada sección/menú por su `roles` usando IDs
 * numéricos en formato string (p. ej. "5"). Los trabajadores entran con rol
 * `business_owner` igual que el dueño; se distinguen por `isWorker: true` en
 * `getMe()`, NO por el rol. `client` queda reservado para uso futuro.
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
