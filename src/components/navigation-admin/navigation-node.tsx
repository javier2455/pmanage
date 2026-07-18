"use client";

import * as React from "react";
import {
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ResolvedIcon } from "@/lib/icon-map";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { NavigationNodeKind } from "@/lib/types/navigation";
import { NAV_NODE_CONFIG } from "./node-config";

interface NavigationNodeProps {
  kind: NavigationNodeKind;
  icon: string;
  title: string;
  /** Cantidad de hijos directos; null si el tipo no tiene hijos. */
  childCount: number | null;
  /** Si tiene hijos, los renderiza dentro del CollapsibleContent. */
  children?: React.ReactNode;
  /** Sólo aplica a nodos que pueden tener hijos (section/menu). */
  onAddChild?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  /** Nivel de indentación (0 para section, 1 para menu, 2 para submenu). */
  depth: 0 | 1 | 2;
  /** Slot opcional para chips/badges (roles, plan, etc.) renderizados al lado del título. */
  badges?: React.ReactNode;
  /** Posición (1..N) dentro de su contenedor. Se muestra como chip. */
  position?: number;
  /** Total de hermanos, para el subtítulo "Posición N de M". */
  siblingCount?: number;

  // ===== Integración con @dnd-kit (opcional) =====
  /** Ref al nodo sortable (contenedor externo). */
  containerRef?: (el: HTMLElement | null) => void;
  /** Estilo de transform/transition del nodo sortable. */
  containerStyle?: React.CSSProperties;
  /** True mientras se arrastra este nodo. */
  isDragging?: boolean;
  /** Botón "asa" de arrastre ya renderizado por el wrapper sortable. */
  dragHandle?: React.ReactNode;
}

export function NavigationNode({
  kind,
  icon,
  title,
  childCount,
  children,
  onAddChild,
  onEdit,
  onDelete,
  depth,
  badges,
  position,
  siblingCount,
  containerRef,
  containerStyle,
  isDragging,
  dragHandle,
}: NavigationNodeProps) {
  const config = NAV_NODE_CONFIG[kind];
  const hasChildren = childCount !== null && childCount > 0;
  const canHaveChildren = kind !== "submenu";

  const [open, setOpen] = React.useState(depth === 0);

  const childSubtitle =
    childCount === null
      ? "Sin hijos"
      : childCount === 0
        ? `Sin ${config.childLabel}`
        : `${childCount} ${config.childLabel}`;

  const positionLabel =
    typeof position === "number"
      ? typeof siblingCount === "number"
        ? `Posición ${position} de ${siblingCount}`
        : `Posición ${position}`
      : "Sin posición";
  const subtitle = `${positionLabel} · ${childSubtitle}`;

  const Row = (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md border px-3 py-2 transition-all duration-200",
        depth === 0 &&
          "border-border/60 bg-card hover:border-border hover:bg-card/80",
        depth > 0 &&
          "border-border/40 bg-transparent hover:border-primary hover:shadow-sm hover:shadow-primary/40",
        isDragging &&
          "border-primary bg-card shadow-lg shadow-primary/20 ring-1 ring-primary/40",
      )}
    >
      {dragHandle}

      {hasChildren ? (
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
            aria-label={open ? "Colapsar" : "Expandir"}
          >
            <ChevronRight
              className={cn(
                "size-4 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
          </button>
        </CollapsibleTrigger>
      ) : (
        <span className="size-6 shrink-0" />
      )}

      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <ResolvedIcon name={icon} className="size-4" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {title}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
              typeof position === "number"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
            title="Posición dentro de su contenedor"
          >
            {typeof position === "number" ? `#${position}` : "#—"}
          </span>
          {badges && <div className="hidden md:block">{badges}</div>}
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 opacity-60 hover:opacity-100"
            aria-label="Acciones"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canHaveChildren && onAddChild && (
            <>
              <DropdownMenuItem onClick={onAddChild}>
                <Plus className="mr-2 size-4" />
                Agregar {kind === "section" ? "menú" : "submenú"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="mr-2 size-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const inner = canHaveChildren ? (
    <Collapsible open={open} onOpenChange={setOpen}>
      {Row}
      <CollapsibleContent>
        <div
          className={cn(
            "mt-1.5 border-l border-dashed border-border/70 pl-4",
            depth === 0 && "ml-5",
            depth === 1 && "ml-5",
          )}
        >
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  ) : (
    Row
  );

  return (
    <div ref={containerRef} style={containerStyle} className="relative">
      {inner}
    </div>
  );
}
