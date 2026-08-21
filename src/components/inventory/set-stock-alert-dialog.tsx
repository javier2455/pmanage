"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellOff, BellRing, Loader2, Package, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiMessage, toastError, toastSuccess } from "@/lib/toast";
import { formatStockWithUnit } from "@/lib/units";
import { useSetStockAlert } from "@/hooks/use-stock-alerts";
import {
  stockAlertSchema,
  type StockAlertFormData,
} from "@/lib/validations/inventory";

interface SetStockAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessProductId: string;
  productName: string;
  currentStock: number;
  currentThreshold: number | null;
  /**
   * Unidad del producto. Sin ella el diálogo redondeaba el stock y lo llamaba
   * "unidades", así que 0,4 kg de café se anunciaban como "0 unidades".
   */
  unit?: string | null;
}

/**
 * Diálogo para configurar/desactivar el umbral de alerta de stock de un
 * producto. Feature Pro. Usa el hook `useSetStockAlert`.
 */
export function SetStockAlertDialog({
  open,
  onOpenChange,
  businessId,
  businessProductId,
  productName,
  currentStock,
  currentThreshold,
  unit,
}: SetStockAlertDialogProps) {
  const mutation = useSetStockAlert();
  const hasAlert = currentThreshold != null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockAlertFormData>({
    resolver: zodResolver(stockAlertSchema),
    defaultValues: { threshold: currentThreshold ?? 1 },
  });

  React.useEffect(() => {
    if (open) reset({ threshold: currentThreshold ?? 1 });
  }, [open, currentThreshold, reset]);

  async function onSubmit(data: StockAlertFormData) {
    try {
      await mutation.mutateAsync({
        businessId,
        businessProductId,
        threshold: data.threshold,
      });
      toastSuccess({
        title: "Alerta de stock guardada",
        description: `Te avisaremos cuando "${productName}" baje de ${formatStockWithUnit(data.threshold, unit)}.`,
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        apiMessage(error) ??
          "No se pudo guardar la alerta de stock.";
      toastError({ title: "Error", description: message });
    }
  }

  async function handleDisable() {
    try {
      await mutation.mutateAsync({
        businessId,
        businessProductId,
        threshold: null,
      });
      toastSuccess({
        title: "Alerta desactivada",
        description: `Ya no recibirás avisos de stock para "${productName}".`,
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        apiMessage(error) ??
          "No se pudo desactivar la alerta de stock.";
      toastError({ title: "Error", description: message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Alerta de stock
          </DialogTitle>
          <DialogDescription>
            Configura el umbral mínimo para{" "}
            <span className="font-medium text-foreground">{productName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="stock-alert-threshold">
              Avisarme cuando el stock baje de
            </Label>
            <Input
              id="stock-alert-threshold"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="Ej: 5"
              onKeyDown={(e) => {
                // El umbral es en unidades enteras: bloqueamos separadores
                // decimales y notación científica.
                if ([".", ",", "e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              {...register("threshold", { valueAsNumber: true })}
              aria-invalid={errors.threshold ? "true" : "false"}
            />
            {errors.threshold ? (
              <p className="text-xs text-destructive">{errors.threshold.message}</p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                Stock actual:{" "}
                <span className="font-medium text-foreground">
                  {formatStockWithUnit(currentStock, unit)}
                </span>
              </p>
            )}
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-2">
            {hasAlert && (
              <Button
                type="button"
                variant="outline"
                className="sm:mr-auto"
                onClick={handleDisable}
                disabled={mutation.isPending}
              >
                <BellOff className="mr-2 h-4 w-4" />
                Desactivar alerta
              </Button>
            )}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {mutation.isPending ? "Guardando..." : "Guardar alerta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
