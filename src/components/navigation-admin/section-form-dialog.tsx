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
  useCreateSectionMutation,
  useUpdateSectionMutation,
} from "@/hooks/use-navigation";
import {
  createSectionSchema,
  updateSectionSchema,
  type CreateSectionFormData,
  type UpdateSectionFormData,
} from "@/lib/validations/navigation";

import { IconPicker } from "./icon-picker";
import { RoleMultiSelect } from "./role-multiselect";

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  sectionId?: string;
  /** Defaults para el modo edición. */
  defaultValues?: Partial<UpdateSectionFormData>;
  /** Próximo `order` sugerido (para create). Default 1 si no se pasa. */
  nextOrder?: number;
}

export function SectionFormDialog(props: SectionFormDialogProps) {
  return props.mode === "edit" ? (
    <EditSectionDialog {...props} />
  ) : (
    <CreateSectionDialog {...props} />
  );
}

// ===== Create =====

function CreateSectionDialog({
  open,
  onOpenChange,
  nextOrder = 1,
}: SectionFormDialogProps) {
  const createMutation = useCreateSectionMutation();

  const emptyDefaults: CreateSectionFormData = React.useMemo(
    () => ({
      name: "",
      icon: "",
      badge: null,
      active: true,
      order: nextOrder,
      roles: [],
      plans: null,
    }),
    [nextOrder],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<CreateSectionFormData>({
    resolver: zodResolver(createSectionSchema),
    defaultValues: emptyDefaults,
  });

  React.useEffect(() => {
    if (open) reset(emptyDefaults);
  }, [open, emptyDefaults, reset]);

  const icon = watch("icon");
  const roles = watch("roles");
  const active = watch("active");

  async function onSubmit(data: CreateSectionFormData) {
    try {
      await createMutation.mutateAsync({
        icon: data.icon,
        name: data.name,
        badge: data.badge ?? null,
        active: data.active,
        order: data.order,
        roles: data.roles,
        plans: data.plans ?? null,
      });
      toastSuccess({
        title: "Sección creada",
        description: `"${data.name}" se agregó al sidebar.`,
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "No se pudo crear la sección.";
      setError("root", { message });
      toastError({ title: "Error", description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Nueva sección</DialogTitle>
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
              <Label htmlFor="section-name">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="section-name"
                placeholder="Ej: Navegación"
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
              <Label htmlFor="section-badge">
                Badge{" "}
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="section-badge"
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="section-order">
                Orden <span className="text-destructive">*</span>
              </Label>
              <Input
                id="section-order"
                type="number"
                min={1}
                {...register("order", { valueAsNumber: true })}
                aria-invalid={errors.order ? "true" : "false"}
              />
              <p className="text-xs text-muted-foreground">
                Sugerido: {nextOrder}. Debe ser mayor que 0.
              </p>
              {errors.order && (
                <p className="text-xs text-destructive">{errors.order.message}</p>
              )}
            </div>
          </div>

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
            Activa (visible en el sidebar)
          </label>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <Separator />

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              {createMutation.isPending ? "Creando..." : "Crear sección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===== Edit =====

function EditSectionDialog({
  open,
  onOpenChange,
  sectionId,
  defaultValues,
}: SectionFormDialogProps) {
  const updateMutation = useUpdateSectionMutation();

  const initial = React.useMemo<UpdateSectionFormData>(
    () => ({
      name: defaultValues?.name ?? "",
      icon: defaultValues?.icon ?? "",
      badge: defaultValues?.badge ?? null,
      active: defaultValues?.active ?? true,
      order: defaultValues?.order ?? 1,
      roles: defaultValues?.roles ?? [],
      plans: defaultValues?.plans ?? null,
    }),
    [defaultValues],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<UpdateSectionFormData>({
    resolver: zodResolver(updateSectionSchema),
    defaultValues: initial,
  });

  React.useEffect(() => {
    if (open) reset(initial);
  }, [open, initial, reset]);

  const icon = watch("icon");
  const roles = watch("roles");
  const active = watch("active");

  async function onSubmit(data: UpdateSectionFormData) {
    if (!sectionId) return;
    try {
      await updateMutation.mutateAsync({ id: sectionId, credentials: data });
      toastSuccess({
        title: "Sección actualizada",
        description: "Los cambios se guardaron correctamente.",
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "No se pudo actualizar la sección.";
      setError("root", { message });
      toastError({ title: "Error", description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-130">
        <DialogHeader>
          <DialogTitle>Editar sección</DialogTitle>
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
              <Label htmlFor="section-name-edit">Nombre</Label>
              <Input
                id="section-name-edit"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Icono</Label>
              <IconPicker
                value={icon ?? ""}
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
              <Label htmlFor="section-badge-edit">
                Badge{" "}
                <span className="text-xs text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="section-badge-edit"
                {...register("badge", {
                  setValueAs: (v) =>
                    typeof v === "string" && v.trim() === "" ? null : v,
                })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="section-order-edit">
                Orden <span className="text-destructive">*</span>
              </Label>
              <Input
                id="section-order-edit"
                type="number"
                min={1}
                {...register("order", { valueAsNumber: true })}
                aria-invalid={errors.order ? "true" : "false"}
              />
              {errors.order && (
                <p className="text-xs text-destructive">{errors.order.message}</p>
              )}
            </div>
          </div>

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
            Activa (visible en el sidebar)
          </label>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <Separator />

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              {updateMutation.isPending ? "Actualizando..." : "Actualizar sección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
