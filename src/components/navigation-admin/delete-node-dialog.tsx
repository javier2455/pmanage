"use client";

import * as React from "react";
import axios from "axios";
import { toastError, toastSuccess } from "@/lib/toast";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useDeleteAdminMenuMutation,
  useDeleteSectionMutation,
  useDeleteSubmenuMutation,
} from "@/hooks/use-navigation";
import type { NavigationNodeKind } from "@/lib/types/navigation";

import { NAV_NODE_CONFIG } from "./node-config";

interface DeleteNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: NavigationNodeKind;
  targetId: string;
  targetName: string;
  /** Conteos opcionales para advertir de cascada */
  childCounts?: { menus?: number; submenus?: number };
}

export function DeleteNodeDialog({
  open,
  onOpenChange,
  kind,
  targetId,
  targetName,
  childCounts,
}: DeleteNodeDialogProps) {
  const config = NAV_NODE_CONFIG[kind];

  const deleteSection = useDeleteSectionMutation();
  const deleteMenu = useDeleteAdminMenuMutation();
  const deleteSubmenu = useDeleteSubmenuMutation();

  const mutation =
    kind === "section"
      ? deleteSection
      : kind === "menu"
        ? deleteMenu
        : deleteSubmenu;

  const cascadeMessage = React.useMemo(() => {
    if (kind === "section" && childCounts) {
      const menus = childCounts.menus ?? 0;
      const submenus = childCounts.submenus ?? 0;
      if (menus === 0 && submenus === 0) return null;
      return `También se eliminarán ${menus} menú(s) y ${submenus} submenú(s) asociados.`;
    }
    if (kind === "menu" && childCounts?.submenus) {
      return `También se eliminarán ${childCounts.submenus} submenú(s) asociados.`;
    }
    return null;
  }, [kind, childCounts]);

  async function handleConfirm() {
    try {
      await mutation.mutateAsync(targetId);
      toastSuccess({
        title: `${config.singular} eliminado`,
        description: `"${targetName}" se eliminó correctamente.`,
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : `No se pudo eliminar la ${config.singularLower}. Intenta de nuevo.`;
      toastError({ title: "Error", description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Eliminar {config.singularLower}
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará{" "}
            <span className="font-medium text-foreground">{targetName}</span>{" "}
            de la navegación.
          </DialogDescription>
        </DialogHeader>

        {cascadeMessage && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {cascadeMessage}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={mutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            {mutation.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
