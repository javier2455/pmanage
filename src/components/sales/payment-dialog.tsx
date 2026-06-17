"use client";

import * as React from "react";
import axios from "axios";
import { Loader2, Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBusiness } from "@/context/business-context";
import { useExchangeRate } from "@/hooks/use-exchange";
import {
  usePaymentsSummary,
  useRegisterPaymentsMutation,
} from "@/hooks/use-sales";
import {
  BASE_CURRENCY,
  convertBetween,
  formatMoney,
  getAvailableCurrencies,
} from "@/lib/currency";
import { makePaymentsSchema } from "@/lib/validations/payments";
import type { PaymentMethod, RegistrarPagoItem } from "@/lib/types/sales";
import { toastError, toastSuccess } from "@/lib/toast";
import { PaymentStatusBadge } from "./payment-status-badge";

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
  { value: "crypto", label: "Cripto" },
];

interface PaymentRow {
  moneda: string;
  monto: string;
  metodo: PaymentMethod;
  referencia: string;
}

/** Traduce el código de error del backend a un mensaje claro. */
function mapPaymentError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { code?: string; error?: string; message?: string }
      | undefined;
    const code = data?.code ?? data?.error ?? data?.message ?? "";
    if (code.includes("PAGO_EXCEDE_TOTAL"))
      return "La suma de pagos supera el total pendiente de la venta.";
    if (code.includes("MONEDAS_NO_CONFIGURADAS"))
      return "El negocio no tiene tasas configuradas para esa moneda.";
    if (code.includes("MONEDA_NO_CONFIGURADA"))
      return "La moneda seleccionada no está configurada en el negocio.";
    if (data?.message) return data.message;
  }
  return "No se pudo registrar el pago. Intenta de nuevo.";
}

interface PaymentDialogProps {
  saleId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  tooltip?: string;
  /** Se llama tras registrar el pago con éxito. */
  onPaid?: () => void;
}

export function PaymentDialog({
  saleId,
  open,
  onOpenChange,
  trigger,
  tooltip,
  onPaid,
}: PaymentDialogProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = React.useCallback(
    (value: boolean) => {
      if (isControlled) onOpenChange?.(value);
      else setInternalOpen(value);
    },
    [isControlled, onOpenChange],
  );

  const { activeBusinessId } = useBusiness();
  const { data: exchangeRate } = useExchangeRate(activeBusinessId ?? "");
  const exchange = exchangeRate?.data;
  const availableCurrencies = React.useMemo(
    () => getAvailableCurrencies(exchange),
    [exchange],
  );

  const { data: summary, isLoading } = usePaymentsSummary(isOpen ? saleId : "");
  const registerMutation = useRegisterPaymentsMutation();

  const monedaBase = summary?.monedaBase ?? BASE_CURRENCY;
  const totalVenta = summary?.totalVenta ?? 0;
  const totalPagado = summary?.totalPagado ?? 0;
  const pendiente = summary?.pendiente ?? 0;
  const estado = summary?.estado ?? "pending";
  const isClosed = estado === "paid" || estado === "cancelled";

  const [rows, setRows] = React.useState<PaymentRow[]>([]);

  // Prefill al abrir: usa la `sugerencia` del backend o el pendiente en moneda base.
  React.useEffect(() => {
    if (!isOpen || !summary) return;
    setRows((prev) => {
      if (prev.length > 0) return prev;
      const sug = summary.sugerencia;
      return [
        {
          moneda: sug?.moneda ?? monedaBase,
          monto: sug ? String(sug.monto) : pendiente > 0 ? String(pendiente) : "",
          metodo: "cash",
          referencia: "",
        },
      ];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, summary]);

  function handleOpenChange(value: boolean) {
    if (!value) setRows([]);
    setOpen(value);
  }

  function updateRow(index: number, patch: Partial<PaymentRow>) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { moneda: monedaBase, monto: "", metodo: "cash", referencia: "" },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  // Equivalente de cada fila en moneda base (preview).
  const equivalentes = rows.map((r) => {
    const monto = Number(r.monto);
    if (!Number.isFinite(monto) || monto <= 0) return 0;
    const eq = convertBetween(monto, r.moneda, monedaBase, exchange);
    return eq ?? 0;
  });
  const totalNuevo = equivalentes.reduce((sum, e) => sum + e, 0);
  const pendienteTrasPago = Math.max(pendiente - totalNuevo, 0);

  /**
   * Autocompleta el monto de una fila para cubrir todo lo que falta, en la moneda
   * de esa fila. Descuenta lo que ya aportan las demás filas (caso típico: pago
   * único en una sola moneda → llena el pendiente completo).
   */
  function fillFullAmount(index: number) {
    const otrasFilasBase = equivalentes.reduce(
      (sum, e, i) => (i === index ? sum : sum + e),
      0,
    );
    const restanteBase = Math.max(pendiente - otrasFilasBase, 0);
    const moneda = rows[index]?.moneda ?? monedaBase;
    const enMoneda =
      moneda === monedaBase
        ? restanteBase
        : convertBetween(restanteBase, monedaBase, moneda, exchange) ?? restanteBase;
    const redondeado = Math.round(enMoneda * 100) / 100;
    updateRow(index, { monto: redondeado > 0 ? String(redondeado) : "" });
  }

  async function handleSubmit() {
    const pagos: RegistrarPagoItem[] = rows.map((r) => ({
      moneda: r.moneda,
      monto: Number(r.monto),
      metodo: r.metodo,
      ...(r.referencia.trim() ? { referencia: r.referencia.trim() } : {}),
    }));

    const parsed = makePaymentsSchema(availableCurrencies).safeParse({ pagos });
    if (!parsed.success) {
      toastError({
        title: "Revisa los pagos",
        description:
          parsed.error.issues[0]?.message ?? "Hay datos de pago inválidos.",
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({
        saleId,
        dto: { pagos: parsed.data.pagos },
        businessId: activeBusinessId ?? "",
      });
      toastSuccess({
        title: "Pago registrado correctamente",
        description: `Se registró un pago equivalente a ${formatMoney(totalNuevo, monedaBase)}.`,
      });
      setRows([]);
      setOpen(false);
      onPaid?.();
    } catch (error) {
      toastError({
        title: "No se pudo registrar el pago",
        description: mapPaymentError(error),
      });
    }
  }

  const triggerContent = trigger ?? (
    <Button variant="outline">Registrar pago</Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {isControlled ? null : (
        <DialogTrigger asChild>
          {tooltip ? (
            <span className="inline-flex">
              <Tooltip>
                <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            </span>
          ) : (
            triggerContent
          )}
        </DialogTrigger>
      )}

      <DialogContent className="flex max-h-[min(90vh,100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px] md:max-w-[560px]">
        {/* Cabecera fija: estado + resumen */}
        <DialogHeader className="shrink-0 gap-3 border-b border-border p-6">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-card-foreground">
              Registrar pago
            </DialogTitle>
            <PaymentStatusBadge status={estado} />
          </div>
          <DialogDescription className="sr-only">
            Registra uno o varios pagos para esta venta.
          </DialogDescription>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/50 px-2 py-2">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold tabular-nums text-card-foreground">
                {formatMoney(totalVenta, monedaBase)}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-2">
              <p className="text-xs text-muted-foreground">Pagado</p>
              <p className="text-sm font-semibold tabular-nums text-emerald-600">
                {formatMoney(totalPagado, monedaBase)}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 px-2 py-2">
              <p className="text-xs text-muted-foreground">Pendiente</p>
              <p className="text-sm font-semibold tabular-nums text-amber-600">
                {formatMoney(pendiente, monedaBase)}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Cuerpo scrollable: filas de pago */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : isClosed ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Wallet className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {estado === "paid"
                  ? "Esta venta ya está completamente pagada."
                  : "Esta venta está cancelada; no admite pagos."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {rows.map((row, index) => {
                const eq = equivalentes[index];
                const showEquivalente = row.moneda !== monedaBase;
                return (
                  <div
                    key={index}
                    className="flex flex-col gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Pago {index + 1}
                      </span>
                      {rows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeRow(index)}
                          aria-label="Quitar pago"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Moneda
                        </Label>
                        <Select
                          value={row.moneda}
                          onValueChange={(v) => updateRow(index, { moneda: v })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCurrencies.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <Label className="text-xs text-muted-foreground">
                            Monto
                          </Label>
                          <button
                            type="button"
                            onClick={() => fillFullAmount(index)}
                            className="text-xs font-medium text-emerald-600 hover:underline"
                          >
                            Pagar todo
                          </button>
                        </div>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={row.monto}
                          placeholder="0.00"
                          onChange={(e) =>
                            updateRow(index, { monto: e.target.value })
                          }
                          className="tabular-nums"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Método
                        </Label>
                        <Select
                          value={row.metodo}
                          onValueChange={(v) =>
                            updateRow(index, { metodo: v as PaymentMethod })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {METHOD_OPTIONS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Referencia
                        </Label>
                        <Input
                          type="text"
                          value={row.referencia}
                          placeholder="Opcional"
                          onChange={(e) =>
                            updateRow(index, { referencia: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {showEquivalente && (
                      <p className="text-xs text-muted-foreground">
                        Equivale a{" "}
                        <span className="font-medium text-card-foreground tabular-nums">
                          {formatMoney(eq, monedaBase)}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRow}
                className="self-start"
              >
                <Plus className="mr-1 size-4" />
                Agregar otra moneda
              </Button>
            </div>
          )}
        </div>

        {/* Footer fijo: resumen del pago + acción */}
        {!isClosed && (
          <DialogFooter className="shrink-0 flex-col gap-3 border-t border-border p-6 sm:flex-col">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total a registrar</span>
              <span className="font-semibold tabular-nums text-card-foreground">
                {formatMoney(totalNuevo, monedaBase)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quedaría pendiente</span>
              <span className="font-semibold tabular-nums text-amber-600">
                {formatMoney(pendienteTrasPago, monedaBase)}
              </span>
            </div>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={registerMutation.isPending || totalNuevo <= 0}
              className="w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 size-4" />
                  Registrar pago
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
