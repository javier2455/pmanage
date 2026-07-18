"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Plus } from "lucide-react";

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
  useGetAllSectionsQuery,
  useReorderAdminMenusMutation,
  useReorderSectionsMutation,
  useReorderSubmenusMutation,
} from "@/hooks/use-navigation";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { toastError } from "@/lib/toast";

import { DeleteNodeDialog } from "@/components/navigation-admin/delete-node-dialog";
import { MenuFormDialog } from "@/components/navigation-admin/menu-form-dialog";
import {
  NavigationTree,
  type NavigationAction,
} from "@/components/navigation-admin/navigation-tree";
import { SectionFormDialog } from "@/components/navigation-admin/section-form-dialog";
import { SubmenuFormDialog } from "@/components/navigation-admin/submenu-form-dialog";

import type {
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

export function MenusClient() {
  const router = useRouter();
  const { roleName, isAdmin } = useUserRoleAndPlan();
  const { activeBusiness } = useBusiness();
  const [dialog, setDialog] = React.useState<DialogState>(null);

  React.useEffect(() => {
    if (roleName && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [roleName, isAdmin, router]);

  const businessId = activeBusiness?.isWorker ? activeBusiness.id : undefined;

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useGetAllSectionsQuery({ businessId, enabled: isAdmin });

  const reorderSectionsMutation = useReorderSectionsMutation();
  const reorderMenusMutation = useReorderAdminMenusMutation();
  const reorderSubmenusMutation = useReorderSubmenusMutation();

  const reorderErrorToast = () =>
    toastError({
      title: "No se pudo reordenar",
      description: "Se restauró el orden anterior. Intenta nuevamente.",
    });

  function handleReorderSections(orderedIds: string[]) {
    reorderSectionsMutation.mutate(
      { orderedIds },
      { onError: reorderErrorToast },
    );
  }

  function handleReorderMenus(sectionId: string, orderedIds: string[]) {
    reorderMenusMutation.mutate(
      { sectionId, orderedIds },
      { onError: reorderErrorToast },
    );
  }

  function handleReorderSubmenus(menuId: string, orderedIds: string[]) {
    reorderSubmenusMutation.mutate(
      { menuId, orderedIds },
      { onError: reorderErrorToast },
    );
  }

  function handleAction(action: NavigationAction) {
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

  const sections = data ?? [];

  return (
    <section className="flex flex-col gap-6 p-6">
      <PageHeader onCreate={() => setDialog({ kind: "section-create" })} />

      <Card>
        <CardContent className="p-4 md:p-6">
          {isLoading || isRefetching ? (
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
            <NavigationTree
              sections={sections}
              onAction={handleAction}
              onReorderSections={handleReorderSections}
              onReorderMenus={handleReorderMenus}
              onReorderSubmenus={handleReorderSubmenus}
            />
          )}
        </CardContent>
      </Card>

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
            dentro de su contenedor.
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
