/**
 * Modelo administrativo de la navegación: Section → AdminMenu → Submenu.
 *
 * Se nombra "AdminMenu" en lugar de "Menu" para no chocar con el shape
 * runtime (MenuItem) que consume el sidebar en src/lib/types/menu.ts.
 */

// ===== Shape devuelto por GET /section =====

export interface NavigationPermissions {
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
  download: boolean;
  all: boolean;
}

/**
 * Submenú devuelto dentro de un menú en la respuesta de GET /section.
 * Tercer nivel del árbol (hoja).
 */
export interface SectionApiSubmenu {
  id: string;
  icon: string;
  name: string;
  badge: string | null;
  url: string;
  active: boolean;
  roles: string[];
  plans: string[] | null;
  order?: number;
}

/**
 * Menú devuelto dentro de una sección en la respuesta de GET /section.
 * Segundo nivel del árbol.
 */
export interface SectionApiMenu {
  id: string;
  icon: string;
  name: string;
  badge: string | null;
  url: string;
  active: boolean;
  roles: string[];
  plans: string[] | null;
  order?: number;
  submenus: SectionApiSubmenu[];
}

/**
 * Sección devuelta por GET /section. Primer nivel del árbol. Las secciones
 * agrupan menús y no tienen URL propia.
 */
export interface SectionApiNode {
  id: string;
  icon: string;
  name: string;
  badge: string | null;
  active: boolean;
  order?: number;
  roles: string[];
  plans: string[] | null;
  menus: SectionApiMenu[];
}

/** Item devuelto cuando se pasa ?isList=true (formato plano). */
export interface SectionListItem {
  idSection?: string;
  idMenu?: string;
  idSubmenu?: string;
  url: string;
  name: string;
  permissions: NavigationPermissions;
}

// ===== Entidades base (para CREATE / UPDATE administrativo) =====

export interface Section {
  id: string;
  name: string;
  icon: string;
  badge: string | null;
  active: boolean;
  order: number;
  roles: string[];
  plans: string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMenu {
  id: string;
  sectionId: string;
  name: string;
  icon: string;
  url: string;
  roles: string[];
  plans: string[] | null;
  active: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Submenu {
  id: string;
  menuId: string;
  name: string;
  icon: string;
  url: string;
  roles: string[];
  plans: string[] | null;
  active: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ===== Lecturas anidadas (lo que consume el árbol) =====

export interface AdminMenuWithSubmenus extends AdminMenu {
  submenus: Submenu[];
}

// ===== Responses =====

export type GetAllSectionsResponse = SectionApiNode[];
export type GetSectionListResponse = SectionListItem[];
export type GetAllAdminMenusResponse = AdminMenuWithSubmenus[];
export type GetAllSubmenusResponse = Submenu[];

// ===== Inputs (Create / Update) =====

/**
 * Body que pide POST /api/v2/section.
 * `order` es opcional: si no se envía, el backend asigna la última posición.
 * El orden final se ajusta con drag & drop.
 */
export interface CreateSectionProps {
  icon: string;
  name: string;
  badge: string | null;
  active: boolean;
  order?: number;
  roles: string[];
  plans: string[] | null;
}
export type UpdateSectionProps = Partial<CreateSectionProps>;

/**
 * Body de POST /api/v2/menu. Backend documenta:
 *   { icon, name, badge, url, active, roles }
 * Por decisión del equipo enviamos `sectionId` también en el body para
 * indicar el padre (el endpoint no lo lleva en path ni query).
 *
 * `order` solo se envía en PATCH (el create lo asigna el backend).
 */
export interface CreateAdminMenuProps {
  sectionId: string;
  icon: string;
  name: string;
  badge: string | null;
  url: string;
  active: boolean;
  roles: string[];
  order?: number;
}
export type UpdateAdminMenuProps = Partial<
  Omit<CreateAdminMenuProps, "sectionId">
>;

/**
 * Body de POST /api/v2/submenu:
 *   { icon, name, badge, url, menuId, active, roles }
 *
 * `order` solo se envía en PATCH (el create lo asigna el backend).
 */
export interface CreateSubmenuProps {
  menuId: string;
  icon: string;
  name: string;
  badge: string | null;
  url: string;
  active: boolean;
  roles: string[];
  order?: number;
}
/**
 * PATCH /api/v2/submenu/{id} acepta `menuId` (permite mover el submenú a
 * otro menú padre). Lo enviamos siempre para mantener consistencia, aunque
 * por ahora la UI no expone el cambio de padre.
 */
export type UpdateSubmenuProps = Partial<CreateSubmenuProps>;

// ===== Reordenamiento (drag & drop) =====

/** Body de PATCH /section/reorder. Lista completa de secciones en el nuevo orden. */
export interface ReorderSectionsProps {
  orderedIds: string[];
}

/** Body de PATCH /menu/reorder. Menús de una sección en el nuevo orden. */
export interface ReorderMenusProps {
  sectionId: string;
  orderedIds: string[];
}

/** Body de PATCH /submenu/reorder. Submenús de un menú en el nuevo orden. */
export interface ReorderSubmenusProps {
  menuId: string;
  orderedIds: string[];
}

/** Menú dentro del árbol atómico de reordenamiento: su id y el orden de sus submenús. */
export interface ReorderTreeMenuInput {
  id: string;
  submenuIds: string[];
}

/** Sección dentro del árbol atómico: su id y el orden de sus menús. */
export interface ReorderTreeSectionInput {
  id: string;
  menus: ReorderTreeMenuInput[];
}

/**
 * Body de PATCH /section/reorder-tree. Árbol COMPLETO en el orden deseado.
 * Se persiste todo en una sola transacción (Guardar cambios) o nada. Permite
 * acumular varios movimientos y confirmarlos juntos en vez de guardar en cada
 * arrastre.
 */
export interface ReorderTreeProps {
  sections: ReorderTreeSectionInput[];
}

// ===== Discriminador para el árbol =====

export type NavigationNodeKind = "section" | "menu" | "submenu";
