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

export interface MenuActionPermissions {
  read: boolean;
  write: boolean;
  update: boolean;
  delete: boolean;
  download: boolean;
  all: boolean;
}

export interface MenuListItem {
  idMenu: string;
  idSubmenu?: string;
  url: string;
  name: string;
  permissions: MenuActionPermissions;
}

export type GetMenuListResponse = MenuListItem[];
