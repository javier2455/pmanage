"use client";

import * as React from "react";

import { RoleBadges } from "./role-badges";
import { NavigationNode } from "./navigation-node";

import type {
  SectionApiMenu,
  SectionApiNode,
  SectionApiSubmenu,
} from "@/lib/types/navigation";

/**
 * Acciones que el árbol delega al contenedor (la página).
 */
export type NavigationAction =
  | { type: "edit-section"; node: SectionApiNode }
  | { type: "delete-section"; node: SectionApiNode }
  | { type: "add-menu"; sectionId: string }
  | { type: "edit-menu"; node: SectionApiMenu; sectionId: string }
  | { type: "delete-menu"; node: SectionApiMenu; sectionId: string }
  | { type: "add-submenu"; menuId: string }
  | { type: "edit-submenu"; node: SectionApiSubmenu; menuId: string }
  | { type: "delete-submenu"; node: SectionApiSubmenu; menuId: string };

interface NavigationTreeProps {
  sections: SectionApiNode[];
  onAction: (action: NavigationAction) => void;
}

export function NavigationTree({ sections, onAction }: NavigationTreeProps) {
  return (
    <div className="flex flex-col gap-2">
      {sections.map((section) => (
        <NavigationNode
          key={section.id}
          kind="section"
          icon={section.icon}
          title={section.name}
          childCount={section.menus?.length ?? 0}
          depth={0}
          order={section.order}
          badges={<RoleBadges roles={section.roles} />}
          onAddChild={() =>
            onAction({ type: "add-menu", sectionId: section.id })
          }
          onEdit={() => onAction({ type: "edit-section", node: section })}
          onDelete={() => onAction({ type: "delete-section", node: section })}
        >
          {(section.menus ?? []).map((menu) => (
            <NavigationNode
              key={menu.id}
              kind="menu"
              icon={menu.icon}
              title={menu.name}
              childCount={menu.submenus?.length ?? 0}
              depth={1}
              order={menu.order}
              badges={<RoleBadges roles={menu.roles} />}
              onAddChild={() =>
                onAction({ type: "add-submenu", menuId: menu.id })
              }
              onEdit={() =>
                onAction({ type: "edit-menu", node: menu, sectionId: section.id })
              }
              onDelete={() =>
                onAction({
                  type: "delete-menu",
                  node: menu,
                  sectionId: section.id,
                })
              }
            >
              {(menu.submenus ?? []).map((submenu) => (
                <NavigationNode
                  key={submenu.id}
                  kind="submenu"
                  icon={submenu.icon}
                  title={submenu.name}
                  childCount={null}
                  depth={2}
                  order={submenu.order}
                  badges={<RoleBadges roles={submenu.roles} />}
                  onEdit={() =>
                    onAction({
                      type: "edit-submenu",
                      node: submenu,
                      menuId: menu.id,
                    })
                  }
                  onDelete={() =>
                    onAction({
                      type: "delete-submenu",
                      node: submenu,
                      menuId: menu.id,
                    })
                  }
                />
              ))}
            </NavigationNode>
          ))}
        </NavigationNode>
      ))}
    </div>
  );
}
