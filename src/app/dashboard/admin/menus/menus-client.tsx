"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Loader2, Plus, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/context/business-context";
import {
  applyOrder,
  useGetAllSectionsQuery,
  useReorderNavigationTreeMutation,
} from "@/hooks/use-navigation";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { toastError, toastSuccess } from "@/lib/toast";

import { DeleteNodeDialog } from "@/components/navigation-admin/delete-node-dialog";
import { MenuFormDialog } from "@/components/navigation-admin/menu-form-dialog";
import {
  NavigationTree,
  type NavigationAction,
} from "@/components/navigation-admin/navigation-tree";
import { SectionFormDialog } from "@/components/navigation-admin/section-form-dialog";
import { SubmenuFormDialog } from "@/components/navigation-admin/submenu-form-dialog";

import type {
  ReorderTreeProps,
  SectionApiMenu,
  SectionApiNode,
  SectionApiSubmenu,
} from "@/lib/types/navigation";

type DialogState =
  | { kind: "section-create" }
  | { kind: "section-edit"; node: SectionApiNode }
  | { kind: "section-delete"; node: SectionApiNode }
  | { kind: "menu-create"; sectionId: string }
  | { kind: "menu-edit"; node: SectionApiMenu; sectionId: string }
  | { kind: "menu-delete"; node: SectionApiMenu; sectionId: string }
  | { kind: "submenu-create"; menuId: string }
  | { kind: "submenu-edit"; node: SectionApiSubmenu; menuId: string }
  | { kind: "submenu-delete"; node: SectionApiSubmenu; menuId: string }
  | null;

function countSectionDescendants(node: SectionApiNode): {
  menus: number;
  submenus: number;
} {
  const menus = node.menus ?? [];
  return {
    menus: menus.length,
    submenus: menus.reduce((acc, m) => acc + (m.submenus?.length ?? 0), 0),
  };
}

/**
 * Firma textual del ORDEN del árbol (ids anidados en secuencia). Sirve para
 * comparar el borrador contra los datos del servidor y saber si de verdad hay
 * cambios que guardar (mover un nodo y devolverlo a su sitio no ensucia).
 */
function orderSignature(sections: SectionApiNode[]): string {
  return sections
    .map(
      (s) =>
        `${s.id}:[${(s.menus ?? [])
          .map(
            (m) =>
              `${m.id}(${(m.submenus ?? []).map((sub) => sub.id).join(",")})`,
          )
          .join(",")}]`,
    )
    .join("|");
}

export function MenusClient() {
  const router = useRouter();
  const { roleName, isAdmin } = useUserRoleAndPlan();
  const { activeBusiness } = useBusiness();
  const [dialog, setDialog] = React.useState<DialogState>(null);
  // Borrador local del árbol: mientras el usuario arrastra, los cambios se
  // acumulan aquí sin tocar el servidor. `null` = sin cambios pendientes.
  const [draft, setDraft] = React.useState<SectionApiNode[] | null>(null);

  React.useEffect(() => {
    if (roleName && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [roleName, isAdmin, router]);

  const businessId = activeBusiness?.isWorker ? activeBusiness.id : undefined;

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useGetAllSectionsQuery({ businessId, enabled: isAdmin });

  const reorderTreeMutation = useReorderNavigationTreeMutation();
  const isSaving = reorderTreeMutation.isPending;

  const serverSections = data ?? [];
  // Lo que se muestra: el borrador si lo hay, si no los datos del servidor.
  const effectiveSections = draft ?? serverSections;
  const isDirty = draft !== null;
  // No mostrar el skeleton de un refetch en segundo plano mientras se edita:
  // el borrador debe permanecer visible.
  const showSkeleton = (isLoading || isRefetching) && draft === null;

  /**
   * Fija el borrador a `next`; si `next` ya coincide con el orden del servidor
   * lo descarta (draft = null) para que la vista vuelva a seguir los datos
   * frescos y la barra Guardar/Cancelar desaparezca.
   */
  function commitDraft(next: SectionApiNode[]) {
    setDraft(
      orderSignature(next) === orderSignature(serverSections) ? null : next,
    );
  }

  function handleReorderSections(orderedIds: string[]) {
    commitDraft(applyOrder(effectiveSections, orderedIds, (s) => s.id));
  }

  function handleReorderMenus(sectionId: string, orderedIds: string[]) {
    commitDraft(
      effectiveSections.map((s) =>
        s.id === sectionId
          ? { ...s, menus: applyOrder(s.menus ?? [], orderedIds, (m) => m.id) }
          : s,
      ),
    );
  }

  function handleReorderSubmenus(menuId: string, orderedIds: string[]) {
    commitDraft(
      effectiveSections.map((s) => ({
        ...s,
        menus: (s.menus ?? []).map((m) =>
          m.id === menuId
            ? {
                ...m,
                submenus: applyOrder(
                  m.submenus ?? [],
                  orderedIds,
                  (sub) => sub.id,
                ),
              }
            : m,
        ),
      })),
    );
  }

  function handleSaveOrder() {
    if (!draft) return;
    const payload: ReorderTreeProps = {
      sections: draft.map((s) => ({
        id: s.id,
        menus: (s.menus ?? []).map((m) => ({
          id: m.id,
          submenuIds: (m.submenus ?? []).map((sub) => sub.id),
        })),
      })),
    };
    reorderTreeMutation.mutate(payload, {
      onSuccess: () => {
        setDraft(null);
        toastSuccess({
          title: "Cambios guardados",
          description:
            "El nuevo orden de la navegación se guardó correctamente.",
        });
      },
      onError: () => {
        toastError({
          title: "No se pudieron guardar los cambios",
          description:
            "No se aplicó ningún cambio. Revisa tu conexión e intenta de nuevo.",
        });
      },
    });
  }

  function handleCancelOrder() {
    setDraft(null);
  }

  function handleAction(action: NavigationAction) {
    // Crear/editar/eliminar refrescan el árbol desde el servidor y pisarían el
    // borrador de orden. Se bloquean hasta guardar o cancelar el reordenamiento.
    if (isDirty) {
      toastError({
        title: "Tienes cambios de orden sin guardar",
        description:
          "Guarda o cancela el reordenamiento antes de crear, editar o eliminar.",
      });
      return;
    }
    switch (action.type) {
      case "edit-section":
        setDialog({ kind: "section-edit", node: action.node });
        break;
      case "delete-section":
        setDialog({ kind: "section-delete", node: action.node });
        break;
      case "add-menu":
        setDialog({ kind: "menu-create", sectionId: action.sectionId });
        break;
      case "edit-menu":
        setDialog({
          kind: "menu-edit",
          node: action.node,
          sectionId: action.sectionId,
        });
        break;
      case "delete-menu":
        setDialog({
          kind: "menu-delete",
          node: action.node,
          sectionId: action.sectionId,
        });
        break;
      case "add-submenu":
        setDialog({ kind: "submenu-create", menuId: action.menuId });
        break;
      case "edit-submenu":
        setDialog({
          kind: "submenu-edit",
          node: action.node,
          menuId: action.menuId,
        });
        break;
      case "delete-submenu":
        setDialog({
          kind: "submenu-delete",
          node: action.node,
          menuId: action.menuId,
        });
        break;
    }
  }

  const close = () => setDialog(null);

  if (!roleName) {
    return (
      <section className="flex flex-col gap-6 p-6">
        <PageHeader onCreate={() => {}} disabled />
        <Card>
          <CardContent className="p-6">
            <TreeSkeleton />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const sections = effectiveSections;

  return (
    <section className="flex flex-col gap-6 p-6">
      <PageHeader
        onCreate={() => setDialog({ kind: "section-create" })}
        disabled={isDirty}
      />

      <Card>
        <CardContent className="p-4 md:p-6">
          {showSkeleton ? (
            <TreeSkeleton />
          ) : isError ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderTree />
                </EmptyMedia>
                <EmptyTitle>No se pudieron cargar las secciones</EmptyTitle>
                <EmptyDescription>
                  {error instanceof Error
                    ? error.message
                    : "Intenta nuevamente en unos segundos."}
                </EmptyDescription>
              </EmptyHeader>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </Empty>
          ) : sections.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderTree />
                </EmptyMedia>
                <EmptyTitle>Sin secciones registradas</EmptyTitle>
                <EmptyDescription>
                  Crea tu primera sección para empezar a organizar la navegación
                  del sistema.
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={() => setDialog({ kind: "section-create" })}>
                <Plus className="mr-2 size-4" />
                Nueva sección
              </Button>
            </Empty>
          ) : (
            <div
              className={
                isSaving
                  ? "pointer-events-none opacity-70 transition-opacity"
                  : undefined
              }
              aria-busy={isSaving}
            >
              <NavigationTree
                sections={sections}
                onAction={handleAction}
                onReorderSections={handleReorderSections}
                onReorderMenus={handleReorderMenus}
                onReorderSubmenus={handleReorderSubmenus}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Barra de acciones: aparece sólo cuando hay reordenamientos pendientes.
          Acumula todos los movimientos y los confirma (o descarta) de una vez. */}
      {isDirty && (
        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Tienes cambios de orden sin guardar.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancelOrder}
              disabled={isSaving}
            >
              <X className="mr-2 size-4" />
              Cancelar
            </Button>
            <Button onClick={handleSaveOrder} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Save className="mr-2 size-4" />
              )}
              Guardar cambios
            </Button>
          </div>
        </div>
      )}

      {/* === Dialogs === */}
      {dialog?.kind === "section-create" && (
        <SectionFormDialog open mode="create" onOpenChange={close} />
      )}
      {dialog?.kind === "section-edit" && (
        <SectionFormDialog
          open
          mode="edit"
          onOpenChange={close}
          sectionId={dialog.node.id}
          defaultValues={{
            name: dialog.node.name,
            icon: dialog.node.icon,
            badge: dialog.node.badge,
            active: dialog.node.active,
            roles: dialog.node.roles,
            plans: dialog.node.plans,
          }}
        />
      )}
      {dialog?.kind === "section-delete" &&
        (() => {
          const counts = countSectionDescendants(dialog.node);
          return (
            <DeleteNodeDialog
              open
              onOpenChange={close}
              kind="section"
              targetId={dialog.node.id}
              targetName={dialog.node.name}
              childCounts={counts}
            />
          );
        })()}

      {dialog?.kind === "menu-create" && (
        <MenuFormDialog
          open
          mode="create"
          onOpenChange={close}
          sectionId={dialog.sectionId}
        />
      )}
      {dialog?.kind === "menu-edit" && (
        <MenuFormDialog
          open
          mode="edit"
          onOpenChange={close}
          sectionId={dialog.sectionId}
          menuId={dialog.node.id}
          defaultValues={{
            sectionId: dialog.sectionId,
            name: dialog.node.name,
            icon: dialog.node.icon,
            badge: dialog.node.badge,
            url: dialog.node.url,
            active: dialog.node.active,
            roles: dialog.node.roles,
          }}
        />
      )}
      {dialog?.kind === "menu-delete" && (
        <DeleteNodeDialog
          open
          onOpenChange={close}
          kind="menu"
          targetId={dialog.node.id}
          targetName={dialog.node.name}
          childCounts={{ submenus: dialog.node.submenus?.length ?? 0 }}
        />
      )}

      {dialog?.kind === "submenu-create" && (
        <SubmenuFormDialog
          open
          mode="create"
          onOpenChange={close}
          menuId={dialog.menuId}
        />
      )}
      {dialog?.kind === "submenu-edit" && (
        <SubmenuFormDialog
          open
          mode="edit"
          onOpenChange={close}
          menuId={dialog.menuId}
          submenuId={dialog.node.id}
          defaultValues={{
            menuId: dialog.menuId,
            name: dialog.node.name,
            icon: dialog.node.icon,
            badge: dialog.node.badge,
            url: dialog.node.url,
            active: dialog.node.active,
            roles: dialog.node.roles,
          }}
        />
      )}
      {dialog?.kind === "submenu-delete" && (
        <DeleteNodeDialog
          open
          onOpenChange={close}
          kind="submenu"
          targetId={dialog.node.id}
          targetName={dialog.node.name}
        />
      )}
    </section>
  );
}

function PageHeader({
  onCreate,
  disabled,
}: {
  onCreate: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FolderTree className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestionar Menús
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra las secciones, menús y submenús del sidebar. Arrastra
            cada elemento por el asa <span aria-hidden>⠿</span> para reordenarlo
            dentro de su contenedor; los cambios se acumulan y se aplican al
            pulsar <strong>Guardar cambios</strong>.
          </p>
        </div>
      </div>
      <Button onClick={onCreate} disabled={disabled}>
        <Plus className="mr-2 size-4" />
        Nueva sección
      </Button>
    </div>
  );
}

function TreeSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2"
        >
          <Skeleton className="size-6 rounded-sm" />
          <Skeleton className="size-9 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}
