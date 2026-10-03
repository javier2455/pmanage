"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  formatDay,
  LICENSE_PAYMENT_CURRENCIES,
  licenseErrorMessage,
  PAYMENT_MONTH_PRESETS,
  PAYMENT_MONTHS_MAX,
  PAYMENT_MONTHS_MIN,
} from "@/lib/desktop-licenses";
import {
  type RegisterPaymentFormData,
  registerPaymentSchema,
} from "@/lib/validations/desktop-licenses";
import { useAddDesktopLicensePaymentMutation } from "@/hooks/use-desktop-licenses";

const DEFAULT_VALUES: RegisterPaymentFormData = {
  months: 1,
  amount: undefined,
  currency: "USD",
  note: "",
};

function monthsLabel(months: number) {
  return `${months} ${months === 1 ? "mes" : "meses"}`;
}

/**
 * Registra un pago (el cliente paga por transferencia y el administrador lo
 * apunta a mano). El servidor alarga el vencimiento y emite otra licencia.
 */
export function RegisterPaymentCard({
  code,
  onRegistered,
}: {
  code: string;
  onRegistered: () => void;
}) {
  const addPaymentMutation = useAddDesktopLicensePaymentMutation();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<RegisterPaymentFormData>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const months = useWatch({ control, name: "months" });
  const validMonths =
    Number.isInteger(months) &&
    months >= PAYMENT_MONTHS_MIN &&
    months <= PAYMENT_MONTHS_MAX;

  async function onSubmit(formData: RegisterPaymentFormData) {
    try {
      const detail = await addPaymentMutation.mutateAsync({
        code,
        months: formData.months,
        amount: formData.amount,
        // La moneda solo describe el importe: sin importe no se manda.
        currency: formData.amount !== undefined ? formData.currency : undefined,
        note: formData.note || undefined,
      });
      toastSuccess({
        title: "Pago registrado",
        description: `Licencia válida hasta el ${formatDay(detail.expiresOn)}.`,
      });
      reset(DEFAULT_VALUES);
      onRegistered();
    } catch (error) {
      const message = licenseErrorMessage(
        error,
        "No se pudo registrar el pago. Intenta de nuevo.",
      );
      toastError({ title: "Error", description: message });
      setError("root", { message });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Registrar pago</CardTitle>
        <CardDescription>
          Si la licencia sigue vigente, los meses se suman al final; si no,
          cuentan desde hoy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="payment-months" className="text-card-foreground">
              Meses <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              {PAYMENT_MONTH_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant={months === preset ? "default" : "outline"}
                  aria-pressed={months === preset}
                  onClick={() =>
                    setValue("months", preset, { shouldValidate: true })
                  }
                >
                  {monthsLabel(preset)}
                </Button>
              ))}
              <Input
                id="payment-months"
                type="number"
                min={PAYMENT_MONTHS_MIN}
                max={PAYMENT_MONTHS_MAX}
                step={1}
                className="h-8 w-20"
                {...register("months", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                aria-invalid={errors.months ? "true" : "false"}
              />
            </div>
            {errors.months && (
              <p className="text-xs text-destructive">{errors.months.message}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="payment-amount" className="text-card-foreground">
                Importe
              </Label>
              <Input
                id="payment-amount"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                {...register("amount", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                })}
                aria-invalid={errors.amount ? "true" : "false"}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="payment-currency" className="text-card-foreground">
                Moneda
              </Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="payment-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {LICENSE_PAYMENT_CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="payment-note" className="text-card-foreground">
              Nota
            </Label>
            <Input
              id="payment-note"
              placeholder="Ej: Transferencia del 02/10"
              {...register("note")}
              aria-invalid={errors.note ? "true" : "false"}
            />
            {errors.note && (
              <p className="text-xs text-destructive">{errors.note.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={addPaymentMutation.isPending}>
              {addPaymentMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CalendarPlus className="size-4" />
              )}
              {addPaymentMutation.isPending
                ? "Registrando..."
                : validMonths
                  ? `Registrar pago de ${monthsLabel(months)}`
                  : "Registrar pago"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
