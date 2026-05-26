"use client";

import * as React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toastError, toastSuccess } from "@/lib/toast";
import { Loader2, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useCreateAdminMenuMutation,
  useUpdateAdminMenuMutation,
} from "@/hooks/use-navigation";
import {
  createAdminMenuSchema,
  type CreateAdminMenuFormData,
} from "@/lib/validations/navigation";

import { IconPicker } from "./icon-picker";
import { RoleMultiSelect } from "./role-multiselect";

interface MenuFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  sectionId: string;
  menuId?: string;
  defaultValues?: Partial<CreateAdminMenuFormData>;
}

const buildEmptyDefaults = (sectionId: string): CreateAdminMenuFormData => ({
  sectionId,
  name: "",
  icon: "",
  badge: null,
  url: "",
  active: true,
  roles: [],
});

export function MenuFormDialog({
  open,
  onOpenChange,
  mode,
  sectionId,
  menuId,
  defaultValues,
}: MenuFormDialogProps) {
  const isEdit = mode === "edit";

  const createMutation = useCreateAdminMenuMutation();
  const updateMutation = useUpdateAdminMenuMutation();
  const mutation = isEdit ? updateMutation : createMutation;

  const initial = React.useMemo<CreateAdminMenuFormData>(
    () => ({ ...buildEmptyDefaults(sectionId), ...defaultValues }),
    [sectionId, defaultValues],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<CreateAdminMenuFormData>({
    resolver: zodResolver(createAdminMenuSchema),
    defaultValues: initial,
  });

  React.useEffect(() => {
    if (open) reset(initial);
  }, [open, initial, reset]);

  const icon = watch("icon");
  const roles = watch("roles");
  const active = watch("active");

  async function onSubmit(data: CreateAdminMenuFormData) {
    try {
      if (isEdit) {
        if (!menuId) return;
        await updateMutation.mutateAsync({
          id: menuId,
          credentials: {
            name: data.name,
            icon: data.icon,
            badge: data.badge ?? null,
            url: data.url,
            active: data.active,
            roles: data.roles,
            order: data.order,
          },
        });
        toastSuccess({
          title: "Menú actualizado",
          description: "Los cambios se guardaron correctamente.",
        });
      } else {
        await createMutation.mutateAsync({
          sectionId: data.sectionId,
          icon: data.icon,
          name: data.name,
          badge: data.badge ?? null,
          url: data.url,
          active: data.active,
          roles: data.roles,
        });
        toastSuccess({
          title: "Menú creado",
          description: `"${data.name}" se agregó a la sección.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : isEdit
            ? "No se pudo actualizar el menú."
            : "No se pudo crear el menú.";
      setError("root", { message });
      toastError({ title: "Error", description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar menú" : "Nuevo menú"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, () => {
            toastError({
              title: "Revisa el formulario",
              description: "Completa todos los campos requeridos.",
            });
          })}
          className="flex flex-col gap-4 pt-2"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="menu-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="menu-name"
                placeholder="Ej: Negocio"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>
                Icono <span className="text-destructive">*</span>
              </Label>
              <IconPicker
                value={icon}
                onChange={(v) =>
                  setValue("icon", v, { shouldValidate: true, shouldDirty: true })
                }
                invalid={!!errors.icon}
              />
              {errors.icon && (
                <p className="text-xs text-destructive">{errors.icon.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="menu-url">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="menu-url"
                placeholder="/dashboard/business"
                {...register("url")}
                aria-invalid={errors.url ? "true" : "false"}
              />
              {errors.url && (
                <p className="text-xs text-destructive">{errors.url.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="menu-badge">
                Badge{" "}
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="menu-badge"
                placeholder="Ej: Pro"
                {...register("badge", {
                  setValueAs: (v) =>
                    typeof v === "string" && v.trim() === "" ? null : v,
                })}
              />
              {errors.badge && (
                <p className="text-xs text-destructive">{errors.badge.message}</p>
              )}
            </div>
          </div>

          {isEdit && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="menu-order">
                Orden <span className="text-destructive">*</span>
              </Label>
              <Input
                id="menu-order"
                type="number"
                min={1}
                {...register("order", { valueAsNumber: true })}
                aria-invalid={errors.order ? "true" : "false"}
              />
              <p className="text-xs text-muted-foreground">
                Define la posición del menú dentro de la sección.
              </p>
              {errors.order && (
                <p className="text-xs text-destructive">{errors.order.message}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>
              Roles con acceso{" "}
              <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <RoleMultiSelect
              value={roles ?? []}
              onChange={(v) =>
                setValue("roles", v, { shouldValidate: true, shouldDirty: true })
              }
              invalid={!!errors.roles}
            />
            {errors.roles && (
              <p className="text-xs text-destructive">
                {errors.roles.message as string}
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!active}
              onCheckedChange={(v) =>
                setValue("active", v === true, { shouldDirty: true })
              }
            />
            Activo (visible en el sidebar)
          </label>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <Separator />

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : isEdit ? (
                <RefreshCw className="mr-2 size-4" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              {mutation.isPending
                ? isEdit
                  ? "Actualizando..."
                  : "Creando..."
                : isEdit
                  ? "Actualizar menú"
                  : "Crear menú"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
