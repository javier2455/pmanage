"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { sileo } from "sileo";
import { PiggyBank, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useInitializeBudgetsMutation } from "@/hooks/use-currency-account";
import {
  InitializeBudgetsFormData,
  initializeBudgetsSchema,
} from "@/lib/validations/currency-account";

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

interface InitializeBudgetsDialogProps {
  businessId: string;
  /** Monedas seleccionables del negocio (CUP + las que tengan tasa). */
  availableCurrencies: string[];
  /** Monedas que ya tienen cuenta creada (se excluyen del formulario). */
  initializedCurrencies: string[];
}

export function InitializeBudgetsDialog({
  businessId,
  availableCurrencies,
  initializedCurrencies,
}: InitializeBudgetsDialogProps) {
  const [open, setOpen] = useState(false);
  const mutation = useInitializeBudgetsMutation();

  // Solo ofrecemos monedas sin cuenta: el backend rechaza duplicados.
  const pendingCurrencies = useMemo(
    () => availableCurrencies.filter((c) => !initializedCurrencies.includes(c)),
    [availableCurrencies, initializedCurrencies],
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<InitializeBudgetsFormData>({
    resolver: zodResolver(initializeBudgetsSchema),
    values: {
      budgets: pendingCurrencies.map((currency) => ({
        currency,
        amount: null,
      })),
    },
  });

  async function onSubmit(formData: InitializeBudgetsFormData) {
    // Mapa moneda → monto, descartando monedas sin valor.
    const initialBudgets = formData.budgets.reduce<Record<string, number>>(
      (acc, row) => {
        if (row.amount != null) acc[row.currency] = row.amount;
        return acc;
      },
      {},
    );

    try {
      await mutation.mutateAsync({ businessId, initialBudgets });
      sileo.success({
        title: "Presupuestos inicializados",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: "Los saldos iniciales se establecieron correctamente",
      });
      reset();
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
          message: "Error al inicializar los presupuestos. Intenta de nuevo.",
        });
      }
    }
  }

  const hasPending = pendingCurrencies.length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!hasPending} className="w-full shrink-0 lg:w-auto">
          <Plus data-icon="inline-start" />
          Inicializar presupuestos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inicializar presupuestos</DialogTitle>
          <DialogDescription>
            Establece el saldo inicial de cada moneda. Solo se muestran las
            monedas que aún no tienen cuenta creada.
          </DialogDescription>
        </DialogHeader>

        {hasPending ? (
          <form
            id="initialize-budgets-form"
            onSubmit={handleSubmit(onSubmit, () => {
              sileo.error({
                title: "Revisa el formulario",
                description: "Establece el presupuesto de al menos una moneda",
              });
            })}
            className="flex flex-col gap-4"
          >
            {pendingCurrencies.map((currency, index) => (
              <div key={currency} className="flex flex-col gap-2">
                <Label
                  htmlFor={`budget-${currency}`}
                  className="text-card-foreground"
                >
                  {currency}
                </Label>
                <input
                  type="hidden"
                  value={currency}
                  {...register(`budgets.${index}.currency`)}
                />
                <Input
                  id={`budget-${currency}`}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  {...register(`budgets.${index}.amount`, {
                    setValueAs: (v) => (v === "" ? null : Number(v)),
                  })}
                  aria-invalid={errors.budgets?.[index]?.amount ? "true" : "false"}
                />
                {errors.budgets?.[index]?.amount && (
                  <p className="text-xs text-destructive">
                    {errors.budgets[index]?.amount?.message}
                  </p>
                )}
              </div>
            ))}

            {errors.budgets?.root && (
              <p className="text-sm text-destructive">
                {errors.budgets.root.message}
              </p>
            )}
            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}
          </form>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            Todas las monedas disponibles ya tienen un presupuesto inicializado.
          </p>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          {hasPending && (
            <Button
              type="submit"
              form="initialize-budgets-form"
              disabled={mutation.isPending}
            >
              <PiggyBank className="mr-2 h-4 w-4" />
              {mutation.isPending ? "Guardando..." : "Guardar presupuestos"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
