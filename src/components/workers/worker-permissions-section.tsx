"use client";

import { useMemo } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMenuListQuery } from "@/hooks/use-menu";
import type { MenuListItem } from "@/lib/types/menu";

interface WorkerPermissionsSectionProps {
  selectedKeys: Set<string>;
  onToggle: (item: MenuListItem, children?: MenuListItem[]) => void;
}

export interface MenuGroup {
  parent: MenuListItem | null;
  parentKey: string | null;
  children: MenuListItem[];
}

export function groupKey(item: MenuListItem): string {
  return item.idSubmenu ?? item.idMenu;
}

export function groupMenuItems(items: MenuListItem[]): MenuGroup[] {
  const groups = new Map<string, MenuGroup>();

  for (const item of items) {
    let group = groups.get(item.idMenu);
    if (!group) {
      group = { parent: null, parentKey: null, children: [] };
      groups.set(item.idMenu, group);
    }
    if (!item.idSubmenu) {
      group.parent = item;
      group.parentKey = item.idMenu;
    } else {
      group.children.push(item);
    }
  }

  return Array.from(groups.values());
}

export function WorkerPermissionsSection({
  selectedKeys,
  onToggle,
}: WorkerPermissionsSectionProps) {
  const { data, isLoading, isError } = useGetMenuListQuery();

  const groups = useMemo(() => groupMenuItems(data ?? []), [data]);

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
    <div className="flex flex-col gap-4">
      {groups.map((group, idx) => {
        const parent = group.parent;
        const parentKey = group.parentKey;
        const groupId = parent?.idMenu ?? `group-${idx}`;
        const parentSelected = parentKey ? selectedKeys.has(parentKey) : false;
        const hasChildSelected = group.children.some((child) =>
          selectedKeys.has(groupKey(child)),
        );
        const showIncompleteWarning =
          parentSelected && group.children.length > 0 && !hasChildSelected;

        return (
          <div
            key={groupId}
            className="rounded-lg border border-border bg-card/40"
          >
            {parent && parentKey ? (
              <label
                htmlFor={`perm-${parentKey}`}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm font-semibold text-foreground">
                  {parent.name}
                </span>
                <Checkbox
                  id={`perm-${parentKey}`}
                  checked={parentSelected}
                  onCheckedChange={() =>
                    onToggle(
                      parent,
                      group.children.length > 0 ? group.children : undefined,
                    )
                  }
                />
              </label>
            ) : null}

            {showIncompleteWarning ? (
              <div className="flex items-start gap-2 border-t border-amber-500/20 bg-amber-500/10 px-4 py-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="text-xs">
                  Selecciona al menos un submenú o desmarca el menú principal.
                </span>
              </div>
            ) : null}

            {group.children.length > 0 ? (
              <ul
                className={
                  parent
                    ? "divide-y divide-border border-t border-border"
                    : "divide-y divide-border"
                }
              >
                {group.children.map((child) => {
                  const childKey = groupKey(child);
                  return (
                    <li key={childKey}>
                      <label
                        htmlFor={`perm-${childKey}`}
                        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 pl-8"
                      >
                        <span className="text-sm text-foreground">
                          {child.name}
                        </span>
                        <Checkbox
                          id={`perm-${childKey}`}
                          checked={selectedKeys.has(childKey)}
                          onCheckedChange={() => onToggle(child)}
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
  );
}
