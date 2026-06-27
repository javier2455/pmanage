import { BASIC_ROUTE } from ".";

/**
 * Endpoints administrativos para gestionar la jerarquía del sidebar:
 * Section → Menu (admin) → Submenu.
 *
 * NOTE: el shape consumido por el sidebar runtime (GET /menu/) vive en
 * src/lib/api/menu.ts y src/lib/types/menu.ts y se queda intacto.
 */
export const navigationRoutes = {
  // ===== Section =====
  getAllSections: `${BASIC_ROUTE}/section`,
  getSectionById: (id: string) => `${BASIC_ROUTE}/section/${id}`,
  createSection: `${BASIC_ROUTE}/section`,
  updateSection: (id: string) => `${BASIC_ROUTE}/section/${id}`,
  deleteSection: (id: string) => `${BASIC_ROUTE}/section/${id}`,

  // ===== Menu (admin) =====
  getAllAdminMenus: `${BASIC_ROUTE}/menu`,
  getAdminMenuById: (id: string) => `${BASIC_ROUTE}/menu/${id}`,
  createAdminMenu: `${BASIC_ROUTE}/menu/`,
  updateAdminMenu: (id: string) => `${BASIC_ROUTE}/menu/${id}`,
  deleteAdminMenu: (id: string) => `${BASIC_ROUTE}/menu/${id}`,

  // ===== Submenu =====
  getAllSubmenus: `${BASIC_ROUTE}/submenu`,
  getSubmenuById: (id: string) => `${BASIC_ROUTE}/submenu/${id}`,
  getSubmenusByMenu: (menuId: string) =>
    `${BASIC_ROUTE}/submenu/menu/${menuId}`,
  createSubmenu: `${BASIC_ROUTE}/submenu`,
  updateSubmenu: (id: string) => `${BASIC_ROUTE}/submenu/${id}`,
  deleteSubmenu: (id: string) => `${BASIC_ROUTE}/submenu/${id}`,
};
