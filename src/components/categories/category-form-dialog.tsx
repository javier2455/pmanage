"use client";

import * as React from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
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
  CreateExpenseCategoryFormData,
  createExpenseCategorySchema,
} from "@/lib/validations/expense-category";
import {
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
} from "@/hooks/use-expense-categories";
import { useBusiness } from "@/context/business-context";

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

interface CategoryFormDialogProps {
  mode: "create" | "edit";
  categoryId?: string;
  defaultValues?: Partial<CreateExpenseCategoryFormData>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CategoryFormDialog({
  mode,
  categoryId,
  defaultValues,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: CategoryFormDialogProps) {
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
  const createMutation = useCreateExpenseCategoryMutation();
  const updateMutation = useUpdateExpenseCategoryMutation();

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
  } = useForm<CreateExpenseCategoryFormData>({
    resolver: zodResolver(createExpenseCategorySchema),
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

  async function onSubmit(formData: CreateExpenseCategoryFormData) {
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
        sileo.success({
          title: "Categoría actualizada correctamente",
          fill: "",
          styles: SUCCESS_TOAST_STYLES,
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
        sileo.success({
          title: "Categoría creada correctamente",
          fill: "",
          styles: SUCCESS_TOAST_STYLES,
          description: "La categoría se ha creado correctamente",
        });
      }
      setOpen(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError("root", { message: error.response.data.message });
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: error.response.data.message,
        });
      } else {
        setError("root", {
          message: isEdit
            ? "Error al actualizar la categoría. Intenta de nuevo."
            : "Error al crear la categoría. Intenta de nuevo.",
        });
      }
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
            sileo.error({
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
