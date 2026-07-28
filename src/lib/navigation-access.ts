import { ADMIN_ROLE_ID, isAdminRoute } from "@/lib/admin-access";
import type { GetAllSectionsResponse } from "@/lib/types/navigation";

/**
 * Mismo criterio de visibilidad que el sidebar: `roles` vacío/null se
 * considera visible para todos los roles. Mantenerlo idéntico garantiza que
 * "lo que se ve en el menú" == "lo que se puede abrir por URL".
 */
export function isVisibleForRole(
  roles: string[] | null | undefined,
  roleId: string,
): boolean {
  if (!roles || roles.length === 0) return true;
  return roles.includes(roleId);
}

/**
 * Visibilidad efectiva de un nodo del árbol: su lista de roles MÁS la barrera
 * del panel de administración.
 *
 * El segundo criterio existe porque `roles` es un campo que alguien tiene que
 * acordarse de marcar al crear el módulo. Si se olvida, un menú bajo
 * `/dashboard/admin` quedaría visible para dueños y trabajadores; aquí se
 * bloquea por su ruta, sin depender de esa configuración.
 */
export function canAccessNode(
  node: { roles?: string[] | null; url?: string | null },
  roleId: string,
): boolean {
  if (!isVisibleForRole(node.roles, roleId)) return false;
  if (isAdminRoute(node.url) && roleId !== ADMIN_ROLE_ID) return false;
  return true;
}

/**
 * Deriva las URLs navegables (menús y submenús) a las que el usuario tiene
 * acceso a partir del árbol de secciones que entrega el backend (ya filtrado
 * por `businessId` para trabajadores). Fuente de verdad única para el sidebar,
 * el guard de acceso y el aterrizaje post-login.
 */
export function collectAllowedUrls(
  sections: GetAllSectionsResponse | undefined | null,
  roleId: string,
): string[] {
  if (!sections) return [];

  const urls: string[] = [];
  for (const section of sections) {
    if (!section.active || !canAccessNode(section, roleId)) continue;

    for (const menu of section.menus ?? []) {
      if (!menu.active || !canAccessNode(menu, roleId)) continue;
      if (menu.url && menu.url !== "#") urls.push(menu.url);

      for (const submenu of menu.submenus ?? []) {
        if (!submenu.active || !canAccessNode(submenu, roleId)) continue;
        if (submenu.url && submenu.url !== "#") urls.push(submenu.url);
      }
    }
  }
  return urls;
}
