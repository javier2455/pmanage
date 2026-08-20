"use client";

import * as React from "react";
import { isAxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, RefreshCw } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createCategorySchema,
  type CreateCategoryFormData,
} from "@/lib/validations/category";
import { toastApiError, toastError, toastSuccess } from "@/lib/toast";
import { useBusiness } from "@/context/business-context";
import { CATEGORY_KINDS, type CategoryKind } from "./kind-config";

type CategoryFormData = CreateCategoryFormData;

interface CategoryFormDialogProps {
  kind: CategoryKind;
  mode: "create" | "edit";
  categoryId?: string;
  defaultValues?: Partial<CategoryFormData>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CategoryFormDialog({
  kind,
  mode,
  categoryId,
  defaultValues,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: CategoryFormDialogProps) {
  const config = CATEGORY_KINDS[kind];
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = isControlled ? openProp : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChangeProp?.(next);
    },
    [isControlled, onOpenChangeProp],
  );

  const { activeBusinessId, businesses } = useBusiness();
  const createMutation = config.useCreate();
  const updateMutation = config.useUpdate();

  const isEdit = mode === "edit";
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      businessId:
        defaultValues?.businessId ?? activeBusinessId ?? "",
    },
  });

  // Reset form whenever the dialog opens (so prefilled edit values stay fresh)
  React.useEffect(() => {
    if (open) {
      reset({
        name: defaultValues?.name ?? "",
        description: defaultValues?.description ?? "",
        businessId:
          defaultValues?.businessId ?? activeBusinessId ?? "",
      });
    }
  }, [open, defaultValues?.name, defaultValues?.description, defaultValues?.businessId, activeBusinessId, reset]);

  const selectedBusinessId = watch("businessId");

  async function onSubmit(formData: CategoryFormData) {
    try {
      if (isEdit) {
        if (!categoryId) return;
        await updateMutation.mutateAsync({
          categoryId,
          credentials: {
            name: formData.name,
            description: formData.description,
          },
        });
        toastSuccess({
          title: "Categoría actualizada correctamente",
          description: "La categoría se ha actualizado correctamente",
        });
      } else {
        if (!formData.businessId) {
          setError("businessId", {
            message: "Selecciona un negocio antes de crear la categoría.",
          });
          return;
        }
        await createMutation.mutateAsync(formData);
        toastSuccess({
          title: "Categoría creada correctamente",
          description: "La categoría se ha creado correctamente",
        });
      }
      setOpen(false);
    } catch (error) {
      const fallback = isEdit
        ? "Error al actualizar la categoría. Intenta de nuevo."
        : "Error al crear la categoría. Intenta de nuevo.";
      // Antes, un error sin `message` en la respuesta solo pintaba el texto al
      // pie del formulario: si el diálogo estaba scrolleado no se veía nada.
      toastApiError(error, fallback);
      setError("root", { message: isAxiosError(error) ? error.response?.data?.message ?? fallback : fallback });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[480px] md:max-w-[560px] overflow-hidden shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {isEdit ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, () => {
            toastError({
              title: "Revisa el formulario",
              description: "Completa todos los campos requeridos correctamente",
            });
          })}
          className="flex flex-col gap-5 pt-2"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name" className="text-card-foreground">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              placeholder="Ej: Servicios"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="category-description"
              className="text-card-foreground"
            >
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="category-description"
              rows={3}
              className="resize-none"
              placeholder="Detalles de la categoría..."
              {...register("description")}
              aria-invalid={errors.description ? "true" : "false"}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-business" className="text-card-foreground">
              Negocio <span className="text-destructive">*</span>
            </Label>
            {isEdit ? (
              <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/50 px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {businesses.find((b) => b.id === selectedBusinessId)?.name ??
                    "—"}
                </span>
              </div>
            ) : (
              <Select
                value={selectedBusinessId}
                onValueChange={(val) =>
                  setValue("businessId", val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger
                  id="category-business"
                  aria-invalid={!!errors.businessId}
                  className="w-full"
                >
                  <SelectValue placeholder="Selecciona un negocio" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.businessId && (
              <p className="text-xs text-destructive">
                {errors.businessId.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <Separator />

          <DialogFooter className="gap-2 sm:gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isEdit ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {mutation.isPending
                ? isEdit
                  ? "Actualizando..."
                  : "Creando..."
                : isEdit
                  ? "Actualizar categoría"
                  : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
