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
    if (!section.active || !isVisibleForRole(section.roles, roleId)) continue;

    for (const menu of section.menus ?? []) {
      if (!menu.active || !isVisibleForRole(menu.roles, roleId)) continue;
      if (menu.url && menu.url !== "#") urls.push(menu.url);

      for (const submenu of menu.submenus ?? []) {
        if (!submenu.active || !isVisibleForRole(submenu.roles, roleId))
          continue;
        if (submenu.url && submenu.url !== "#") urls.push(submenu.url);
      }
    }
  }
  return urls;
}
