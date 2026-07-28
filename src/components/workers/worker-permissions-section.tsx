"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllSectionsQuery } from "@/hooks/use-navigation";
import {
  buildPermSections,
  toSelectedItem,
  toSelectedSubItem,
  type SelectedPermItem,
} from "@/lib/worker-permissions";

/**
 * La normalización del árbol (y el filtrado de todo lo exclusivo de
 * administradores) vive en `@/lib/worker-permissions`, fuera de este
 * componente, para poder ejercitarla en las suites compartidas. Se re-exporta
 * aquí porque el formulario ya la importaba desde este módulo.
 */
export {
  buildPermSections,
  flattenPermItems,
  permKey,
  type PermMenu,
  type PermSection,
  type PermSubmenu,
  type SelectedPermItem,
} from "@/lib/worker-permissions";

interface WorkerPermissionsSectionProps {
  selectedKeys: Set<string>;
  onToggle: (item: SelectedPermItem, children?: SelectedPermItem[]) => void;
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
