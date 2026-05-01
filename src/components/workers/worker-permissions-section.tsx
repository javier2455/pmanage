"use client";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMenuListQuery } from "@/hooks/use-menu";
import type { MenuListItem } from "@/lib/types/menu";

interface WorkerPermissionsSectionProps {
  selectedKeys: Set<string>;
  onToggle: (item: MenuListItem) => void;
}

interface MenuGroup {
  parent: MenuListItem | null;
  parentKey: string | null;
  children: MenuListItem[];
}

function groupKey(item: MenuListItem): string {
  return item.idSubmenu ?? item.idMenu;
}

function groupMenuItems(items: MenuListItem[]): MenuGroup[] {
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
                  checked={selectedKeys.has(parentKey)}
                  onCheckedChange={() => onToggle(parent)}
                />
              </label>
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
