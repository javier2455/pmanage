/**
 * Fuente única de verdad de "qué pertenece al panel de Administración".
 *
 * Administración es territorio exclusivo del rol administrador (`roleId "5"`):
 * ni los dueños de negocio ni sus trabajadores deben verla, abrirla ni poder
 * recibirla como permiso. Antes esto se sostenía con una lista negra de URLs
 * concretas en el selector de permisos, que había que ampliar a mano cada vez
 * que se creaba un módulo nuevo (y ya se había quedado corta).
 *
 * Aquí la restricción es **estructural** y se evalúa con dos criterios
 * independientes, de modo que un módulo nuevo queda bloqueado aunque se olvide
 * configurar el otro:
 *
 *  1. **Por rol declarado** — un nodo cuyos `roles` se reducen al de admin.
 *  2. **Por ruta** — cualquier URL con el segmento `/admin/` (misma frontera
 *     que usa el `RouteGuard`), sin enumerar rutas concretas.
 *
 * Y se **hereda hacia abajo**: si la sección es solo-admin, todos sus menús y
 * submenús lo son, tengan o no `roles` propios. Crear un menú nuevo dentro de
 * "Administración" no requiere tocar este archivo: nace bloqueado.
 *
 * Sin React ni APIs de navegador: lo consumen el middleware, el guard de
 * rutas, el sidebar y el formulario de permisos de trabajadores.
 */

import { ROLE_ID_BY_NAME } from "@/lib/roles";
import type {
  SectionApiMenu,
  SectionApiNode,
  SectionApiSubmenu,
} from "@/lib/types/navigation";

/** ID del rol administrador tal como lo devuelve el backend en `roles`. */
export const ADMIN_ROLE_ID = ROLE_ID_BY_NAME.admin;

/** Prefijo de las rutas del panel de administración. */
export const ADMIN_ROUTE_PREFIX = "/dashboard/admin";

/** Segmento que marca una ruta como administrativa dentro de cualquier prefijo. */
const ADMIN_SEGMENT = "admin";

/**
 * ¿La URL pertenece al panel de administración?
 *
 * Se evalúa por segmento de ruta, no contra una lista de rutas conocidas: da
 * igual que la URL venga como `/dashboard/admin/menus` o `/admin/menus`, y
 * cualquier ruta futura que cuelgue de admin queda cubierta sin editar nada.
 * Un segmento que solo empiece por "admin" (p. ej. `/dashboard/admin-notes`)
 * NO cuenta.
 */
export function isAdminRoute(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = url.split(/[?#]/)[0];
  return path.split("/").filter(Boolean).includes(ADMIN_SEGMENT);
}

/**
 * ¿La lista de roles restringe el nodo a administradores?
 *
 * `roles` vacío/null significa "sin restricción" (visible para todos), igual
 * que en `isVisibleForRole`. Se exige que TODOS los roles declarados sean el
 * de admin: `["5"]` es solo-admin, pero `["4","5"]` no lo es porque también
 * habilita al dueño de negocio.
 */
export function isAdminOnlyRoles(roles: string[] | null | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.every((role) => role === ADMIN_ROLE_ID);
}

/** ¿Este nodo es exclusivo de admin por su rol declarado o por su ruta? */
export function isAdminOnlyNode(node: {
  roles?: string[] | null;
  url?: string | null;
}): boolean {
  return isAdminOnlyRoles(node.roles) || isAdminRoute(node.url);
}

/**
 * Poda del árbol de navegación todo lo que es exclusivo de administradores,
 * aplicando la herencia sección → menú → submenú. Lo que queda es lo que un
 * usuario sin rol admin puede llegar a tener asignado.
 *
 * Las secciones que quedan sin menús se descartan por completo (no tiene
 * sentido pintar un grupo vacío en el selector de permisos).
 */
export function filterAssignableSections(
  sections: SectionApiNode[] | null | undefined,
): SectionApiNode[] {
  if (!sections) return [];

  const result: SectionApiNode[] = [];

  for (const section of sections) {
    // Sección solo-admin: se descarta entera, con todo lo que cuelgue de ella
    // ahora y en el futuro.
    if (isAdminOnlyNode(section)) continue;

    const menus: SectionApiMenu[] = [];

    for (const menu of section.menus ?? []) {
      if (isAdminOnlyNode(menu)) continue;

      const submenus: SectionApiSubmenu[] = (menu.submenus ?? []).filter(
        (submenu) => !isAdminOnlyNode(submenu),
      );

      menus.push({ ...menu, submenus });
    }

    if (menus.length > 0) {
      result.push({ ...section, menus });
    }
  }

  return result;
}
