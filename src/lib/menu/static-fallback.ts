import type { MenuItem } from "@/lib/types/menu";

// DEPRECATED: el sidebar ahora se alimenta de GET /api/v2/section
// (ver src/components/sidebar/sidebar.tsx). Este fallback ya no se
// importa desde ningún lado. Se conserva el archivo temporalmente por
// si algún flujo legacy lo necesita; eliminar cuando se confirme.
export const STATIC_CATEGORIES_MENU_ITEM: MenuItem = {
  id: "static-categories",
  icon: "Tags",
  name: "Categorías",
  badge: null,
  url: "/dashboard/business/categories",
  active: true,
  roles: null,
  plans: null,
  submenus: [],
};
