export interface MenuSubItem {
  id: string;
  icon: string;
  name: string;
  badge: string | null;
  url: string;
  active: boolean;
  roles: string[] | null;
  plans: string[] | null;
}

export interface MenuItem extends MenuSubItem {
  submenus: MenuSubItem[];
}

export type GetAllMenuItemsResponse = MenuItem[];
