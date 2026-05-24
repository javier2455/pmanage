import type { MenuItem } from "@/lib/types/menu";

// TODO: retirar este archivo cuando el backend incluya el menu de "Categorías"
// en la respuesta de GET /menu/. El merge en sidebar.tsx ya evita duplicados
// si el backend lo agrega antes de que esto sea removido.
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
