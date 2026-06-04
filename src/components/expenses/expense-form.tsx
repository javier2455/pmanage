"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import { HandCoins, RefreshCw, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CreateExpenseFormData,
  createExpenseSchema,
} from "@/lib/validations/expenses";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from "@/hooks/use-expenses";
import { useGetAllExpenseCategoriesQuery } from "@/hooks/use-expense-categories";
import { useBusiness } from "@/context/business-context";

const NO_CATEGORY_VALUE = "__none__";

interface ExpenseFormProps {
  mode: "create" | "edit";
  expenseId?: string;
  defaultValues?: Partial<CreateExpenseFormData>;
}

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

export function ExpenseForm({
  mode,
  expenseId,
  defaultValues,
}: ExpenseFormProps) {
  const router = useRouter();
  const { activeBusinessId } = useBusiness();
  const createMutation = useCreateExpenseMutation();
  const updateMutation = useUpdateExpenseMutation();

  const isEdit = mode === "edit";
  const mutation = isEdit ? updateMutation : createMutation;

  const { data: categoriesData, isLoading: isLoadingCategories } =
    useGetAllExpenseCategoriesQuery({
      page: 1,
      limit: 1000,
      businessId: activeBusinessId ?? undefined,
      enabled: !!activeBusinessId,
    });
  const categories = categoriesData?.data ?? [];

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      description: defaultValues?.description ?? "",
      expenseCategoryId: defaultValues?.expenseCategoryId ?? null,
    },
  });

  const selectedCategoryId = watch("expenseCategoryId");

  async function onSubmit(formData: CreateExpenseFormData) {
    const normalizedCategoryId =
      formData.expenseCategoryId && formData.expenseCategoryId.length > 0
        ? formData.expenseCategoryId
        : null;
    const payload = {
      ...formData,
      expenseCategoryId: normalizedCategoryId,
    };
    try {
      if (isEdit) {
        if (!expenseId) return;
        await updateMutation.mutateAsync({
          expenseId,
          credentials: payload,
        });
        sileo.success({
          title: "Gasto actualizado correctamente",
          fill: "",
          styles: SUCCESS_TOAST_STYLES,
          description: "El gasto se ha actualizado correctamente",
        });
      } else {
        if (!activeBusinessId) {
          setError("root", {
            message: "Selecciona un negocio activo antes de registrar el gasto.",
          });
          return;
        }
        await createMutation.mutateAsync({
          idbusiness: activeBusinessId,
          ...payload,
        });
        sileo.success({
          title: "Gasto registrado correctamente",
          fill: "",
          styles: SUCCESS_TOAST_STYLES,
          description: "El gasto se ha registrado correctamente",
        });
      }
      router.push("/dashboard/business/expenses");
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
            ? "Error al actualizar el gasto. Intenta de nuevo."
            : "Error al registrar el gasto. Intenta de nuevo.",
        });
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        sileo.error({
          title: "Revisa el formulario",
          description: "Completa todos los campos requeridos correctamente",
        });
      })}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-title" className="text-card-foreground">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="expense-title"
          placeholder="Ej: Pago de servicios públicos"
          {...register("title")}
          aria-invalid={errors.title ? "true" : "false"}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-amount" className="text-card-foreground">
          Monto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="expense-amount"
          type="number"
          min={1}
          step="0.01"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
          aria-invalid={errors.amount ? "true" : "false"}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-description" className="text-card-foreground">
          Descripción <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="expense-description"
          rows={4}
          className="resize-none"
          placeholder="Detalles del gasto..."
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
        <Label htmlFor="expense-category" className="text-card-foreground">
          Categoría
        </Label>
        <Select
          value={selectedCategoryId ?? NO_CATEGORY_VALUE}
          onValueChange={(val) =>
            setValue(
              "expenseCategoryId",
              val === NO_CATEGORY_VALUE ? null : val,
              { shouldDirty: true },
            )
          }
          disabled={isLoadingCategories || categories.length === 0}
        >
          <SelectTrigger id="expense-category" className="w-full">
            <SelectValue
              placeholder={
                isLoadingCategories
                  ? "Cargando categorías..."
                  : categories.length === 0
                    ? "Aún no hay categorías"
                    : "Sin categoría"
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY_VALUE}>Sin categoría</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Opcional — administra tus categorías en la sección de{" "}
          <Link
            href="/dashboard/business/categories/expenses"
            className="underline-offset-2 hover:underline"
          >
            Categorías
          </Link>
          .
        </p>
      </div>

      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <Separator />

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="default" asChild>
          <Link href="/dashboard/business/expenses">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Link>
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {isEdit ? (
            <RefreshCw className="mr-2 h-4 w-4" />
          ) : (
            <HandCoins className="mr-2 h-4 w-4" />
          )}
          {mutation.isPending
            ? isEdit
              ? "Actualizando..."
              : "Registrando..."
            : isEdit
              ? "Actualizar gasto"
              : "Registrar gasto"}
        </Button>
      </div>
    </form>
  );
}
