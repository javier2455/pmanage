/**
 * Lógica pura del selector de permisos de trabajadores: normaliza el árbol de
 * `GET /section` a la jerarquía que pinta el acordeón y lo aplana a items
 * seleccionables.
 *
 * Vive fuera del componente para poder ejercitarse en las suites compartidas
 * (`src/testing/suites/`), que corren tanto en Vitest como en el navegador y
 * no pueden importar React.
 */

import { filterAssignableSections } from "@/lib/admin-access";
import type { SectionApiNode } from "@/lib/types/navigation";

/**
 * Item plano (menú o submenú) que el formulario guarda como seleccionado.
 * Lleva `idSection` para que al construir el payload podamos emitir también
 * la entrada de la sección padre (el backend la exige en el array de permisos).
 */
export interface SelectedPermItem {
  idSection: string;
  idMenu: string;
  idSubmenu?: string;
  name: string;
}

export interface PermSubmenu {
  idSection: string;
  idMenu: string;
  idSubmenu: string;
  name: string;
  url: string;
}

export interface PermMenu {
  idSection: string;
  idMenu: string;
  name: string;
  url: string;
  submenus: PermSubmenu[];
}

export interface PermSection {
  idSection: string;
  name: string;
  menus: PermMenu[];
}

export function permKey(item: { idMenu: string; idSubmenu?: string }): string {
  return item.idSubmenu ?? item.idMenu;
}

/**
 * Normaliza el árbol de GET /section a la jerarquía que pinta el acordeón.
 *
 * Todo lo exclusivo de administradores se descarta antes de mapear, usando
 * `filterAssignableSections` (ver `@/lib/admin-access`): la restricción vive
 * en el rol declarado del nodo y en su ruta `/admin/…`, y se hereda de la
 * sección hacia sus menús y submenús. Así, un módulo nuevo dentro de
 * Administración queda fuera del selector sin tener que tocar este archivo.
 */
export function buildPermSections(nodes: SectionApiNode[]): PermSection[] {
  const sections: PermSection[] = [];

  for (const section of filterAssignableSections(nodes)) {
    const menus: PermMenu[] = [];

    for (const menu of section.menus ?? []) {
      const submenus: PermSubmenu[] = (menu.submenus ?? []).map((sub) => ({
        idSection: section.id,
        idMenu: menu.id,
        idSubmenu: sub.id,
        name: sub.name,
        url: sub.url,
      }));

      menus.push({
        idSection: section.id,
        idMenu: menu.id,
        name: menu.name,
        url: menu.url,
        submenus,
      });
    }

    if (menus.length > 0) {
      sections.push({ idSection: section.id, name: section.name, menus });
    }
  }

  return sections;
}

/** Aplana las secciones a items seleccionables (menús + submenús). */
export function flattenPermItems(sections: PermSection[]): SelectedPermItem[] {
  const items: SelectedPermItem[] = [];

  for (const section of sections) {
    for (const menu of section.menus) {
      items.push({
        idSection: menu.idSection,
        idMenu: menu.idMenu,
        name: menu.name,
      });
      for (const sub of menu.submenus) {
        items.push({
          idSection: sub.idSection,
          idMenu: sub.idMenu,
          idSubmenu: sub.idSubmenu,
          name: sub.name,
        });
      }
    }
  }

  return items;
}

export function toSelectedItem(menu: PermMenu): SelectedPermItem {
  return { idSection: menu.idSection, idMenu: menu.idMenu, name: menu.name };
}

export function toSelectedSubItem(sub: PermSubmenu): SelectedPermItem {
  return {
    idSection: sub.idSection,
    idMenu: sub.idMenu,
    idSubmenu: sub.idSubmenu,
    name: sub.name,
  };
}
