"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

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
  /** Reordena las secciones (nivel raíz). */
  onReorderSections: (orderedIds: string[]) => void;
  /** Reordena los menús dentro de una sección. */
  onReorderMenus: (sectionId: string, orderedIds: string[]) => void;
  /** Reordena los submenús dentro de un menú. */
  onReorderSubmenus: (menuId: string, orderedIds: string[]) => void;
}

/**
 * Envuelve una lista de hermanos en su propio DndContext + SortableContext.
 * Cada nivel del árbol usa uno independiente, de modo que un arrastre siempre
 * queda acotado a los hermanos del mismo contenedor (no se puede mover un
 * menú a otra sección desde aquí — eso lo hace el diálogo de edición).
 */
function SortableGroup({
  ids,
  onReorder,
  className,
  children,
}: {
  ids: string[];
  onReorder: (orderedIds: string[]) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const sensors = useSensors(
    // distance:5 evita que un click en los botones dispare un arrastre.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>{children}</div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * Nodo del árbol conectado a useSortable. Aporta el ref del contenedor, el
 * transform/transition del arrastre y el handle. El resto de la presentación
 * vive en <NavigationNode/>.
 */
function SortableNode({
  id,
  children,
  ...nodeProps
}: {
  id: string;
} & Omit<
  React.ComponentProps<typeof NavigationNode>,
  "containerRef" | "containerStyle" | "isDragging" | "dragHandle"
>) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  // El botón-asa se construye aquí (patrón canónico de dnd-kit: callback ref +
  // attributes/listeners spread) y se pasa ya renderizado a NavigationNode.
  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      className="flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground/50 hover:bg-muted hover:text-foreground active:cursor-grabbing"
      aria-label="Arrastrar para reordenar"
      title="Arrastrar para reordenar"
    >
      <GripVertical className="size-4" />
    </button>
  );

  return (
    <NavigationNode
      {...nodeProps}
      containerRef={setNodeRef}
      containerStyle={style}
      isDragging={isDragging}
      dragHandle={dragHandle}
    >
      {children}
    </NavigationNode>
  );
}

export function NavigationTree({
  sections,
  onAction,
  onReorderSections,
  onReorderMenus,
  onReorderSubmenus,
}: NavigationTreeProps) {
  return (
    <SortableGroup
      ids={sections.map((s) => s.id)}
      onReorder={onReorderSections}
      className="flex flex-col gap-2"
    >
      {sections.map((section, sIndex) => {
        const menus = section.menus ?? [];
        return (
          <SortableNode
            key={section.id}
            id={section.id}
            kind="section"
            icon={section.icon}
            title={section.name}
            childCount={menus.length}
            depth={0}
            position={sIndex + 1}
            siblingCount={sections.length}
            badges={<RoleBadges roles={section.roles} />}
            onAddChild={() =>
              onAction({ type: "add-menu", sectionId: section.id })
            }
            onEdit={() => onAction({ type: "edit-section", node: section })}
            onDelete={() => onAction({ type: "delete-section", node: section })}
          >
            <SortableGroup
              ids={menus.map((m) => m.id)}
              onReorder={(orderedIds) => onReorderMenus(section.id, orderedIds)}
              className="flex flex-col gap-1.5"
            >
              {menus.map((menu, mIndex) => {
                const submenus = menu.submenus ?? [];
                return (
                  <SortableNode
                    key={menu.id}
                    id={menu.id}
                    kind="menu"
                    icon={menu.icon}
                    title={menu.name}
                    childCount={submenus.length}
                    depth={1}
                    position={mIndex + 1}
                    siblingCount={menus.length}
                    badges={<RoleBadges roles={menu.roles} />}
                    onAddChild={() =>
                      onAction({ type: "add-submenu", menuId: menu.id })
                    }
                    onEdit={() =>
                      onAction({
                        type: "edit-menu",
                        node: menu,
                        sectionId: section.id,
                      })
                    }
                    onDelete={() =>
                      onAction({
                        type: "delete-menu",
                        node: menu,
                        sectionId: section.id,
                      })
                    }
                  >
                    <SortableGroup
                      ids={submenus.map((s) => s.id)}
                      onReorder={(orderedIds) =>
                        onReorderSubmenus(menu.id, orderedIds)
                      }
                      className="flex flex-col gap-1.5"
                    >
                      {submenus.map((submenu, subIndex) => (
                        <SortableNode
                          key={submenu.id}
                          id={submenu.id}
                          kind="submenu"
                          icon={submenu.icon}
                          title={submenu.name}
                          childCount={null}
                          depth={2}
                          position={subIndex + 1}
                          siblingCount={submenus.length}
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
                    </SortableGroup>
                  </SortableNode>
                );
              })}
            </SortableGroup>
          </SortableNode>
        );
      })}
    </SortableGroup>
  );
}
