"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllSectionsQuery } from "@/hooks/use-navigation";
import type { SectionApiNode } from "@/lib/types/navigation";

interface WorkerPermissionsSectionProps {
  selectedKeys: Set<string>;
  onToggle: (item: SelectedPermItem, children?: SelectedPermItem[]) => void;
}

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
 * Módulos exclusivos de administradores del sistema que NO deben poder
 * asignarse a un trabajador (ni a dueños de negocio, sea plan gratuito,
 * básico o pro). Se identifican por su URL para ser estables ante cambios
 * de nombre en el backend.
 */
const ADMIN_ONLY_URL_SEGMENTS = ["/admin/assign-plans", "/admin/menus"];

function isAssignableUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  return !ADMIN_ONLY_URL_SEGMENTS.some((segment) => url.includes(segment));
}

/**
 * Normaliza el árbol de GET /section a la jerarquía que pinta el acordeón,
 * descartando los módulos exclusivos de admin y las secciones que quedan
 * vacías tras el filtrado.
 */
export function buildPermSections(nodes: SectionApiNode[]): PermSection[] {
  const sections: PermSection[] = [];

  for (const section of nodes) {
    const menus: PermMenu[] = [];

    for (const menu of section.menus ?? []) {
      if (!isAssignableUrl(menu.url)) continue;

      const submenus: PermSubmenu[] = (menu.submenus ?? [])
        .filter((sub) => isAssignableUrl(sub.url))
        .map((sub) => ({
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

function toSelectedItem(menu: PermMenu): SelectedPermItem {
  return { idSection: menu.idSection, idMenu: menu.idMenu, name: menu.name };
}

function toSelectedSubItem(sub: PermSubmenu): SelectedPermItem {
  return {
    idSection: sub.idSection,
    idMenu: sub.idMenu,
    idSubmenu: sub.idSubmenu,
    name: sub.name,
  };
}

export function WorkerPermissionsSection({
  selectedKeys,
  onToggle,
}: WorkerPermissionsSectionProps) {
  const { data, isLoading, isError } = useGetAllSectionsQuery();

  const sections = useMemo(() => buildPermSections(data ?? []), [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
      >
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">No se pudieron cargar los módulos</span>
          <span className="text-destructive/90">
            Intenta recargar la página.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.idSection} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.name}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-4">
            {section.menus.map((menu) => {
              const menuKey = menu.idMenu;
              const menuSelected = selectedKeys.has(menuKey);
              const hasChildren = menu.submenus.length > 0;
              const hasChildSelected = menu.submenus.some((sub) =>
                selectedKeys.has(sub.idSubmenu),
              );
              const showIncompleteWarning =
                menuSelected && hasChildren && !hasChildSelected;
              const childItems = hasChildren
                ? menu.submenus.map(toSelectedSubItem)
                : undefined;

              return (
                <div
                  key={menuKey}
                  className="rounded-lg border border-border bg-card/40"
                >
                  <label
                    htmlFor={`perm-${menuKey}`}
                    className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {menu.name}
                    </span>
                    <Checkbox
                      id={`perm-${menuKey}`}
                      checked={menuSelected}
                      onCheckedChange={() =>
                        onToggle(toSelectedItem(menu), childItems)
                      }
                    />
                  </label>

                  {showIncompleteWarning ? (
                    <div className="flex items-start gap-2 border-t border-amber-500/20 bg-amber-500/10 px-4 py-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-xs">
                        Selecciona al menos un submenú o desmarca el menú
                        principal.
                      </span>
                    </div>
                  ) : null}

                  {hasChildren ? (
                    <ul className="divide-y divide-border border-t border-border">
                      {menu.submenus.map((sub) => {
                        const subKey = sub.idSubmenu;
                        return (
                          <li key={subKey}>
                            <label
                              htmlFor={`perm-${subKey}`}
                              className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 pl-8"
                            >
                              <span className="text-sm text-foreground">
                                {sub.name}
                              </span>
                              <Checkbox
                                id={`perm-${subKey}`}
                                checked={selectedKeys.has(subKey)}
                                onCheckedChange={() =>
                                  onToggle(toSelectedSubItem(sub))
                                }
                              />
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
