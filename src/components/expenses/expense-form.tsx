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
  CreateExpenseFormData,
  createExpenseSchema,
} from "@/lib/validations/expenses";
import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from "@/hooks/use-expenses";
import { useBusiness } from "@/context/business-context";

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

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      amount: defaultValues?.amount ?? (undefined as unknown as number),
      description: defaultValues?.description ?? "",
    },
  });

  async function onSubmit(formData: CreateExpenseFormData) {
    try {
      if (isEdit) {
        if (!expenseId) return;
        await updateMutation.mutateAsync({
          expenseId,
          credentials: formData,
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
          ...formData,
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
