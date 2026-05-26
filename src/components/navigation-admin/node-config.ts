import type { LucideIcon } from "lucide-react";
import { FolderTree, LayoutList, ListTree } from "lucide-react";

import type { NavigationNodeKind } from "@/lib/types/navigation";

export interface NavigationNodeKindConfig {
  kind: NavigationNodeKind;
  singular: string;
  singularLower: string;
  plural: string;
  icon: LucideIcon;
  childLabel: string; // "menús" / "submenús" / ""
}

export const NAV_NODE_CONFIG: Record<NavigationNodeKind, NavigationNodeKindConfig> = {
  section: {
    kind: "section",
    singular: "Sección",
    singularLower: "sección",
    plural: "Secciones",
    icon: FolderTree,
    childLabel: "menús",
  },
  menu: {
    kind: "menu",
    singular: "Menú",
    singularLower: "menú",
    plural: "Menús",
    icon: LayoutList,
    childLabel: "submenús",
  },
  submenu: {
    kind: "submenu",
    singular: "Submenú",
    singularLower: "submenú",
    plural: "Submenús",
    icon: ListTree,
    childLabel: "",
  },
};
