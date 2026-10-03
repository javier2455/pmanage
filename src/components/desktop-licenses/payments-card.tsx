"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toastError, toastSuccess } from "@/lib/toast";
import { formatDateTimeShort } from "@/lib/dates";
import {
  formatDay,
  formatPaymentAmount,
  licenseErrorMessage,
} from "@/lib/desktop-licenses";
import { DASH } from "@/lib/utils";
import { useRemoveDesktopLicensePaymentMutation } from "@/hooks/use-desktop-licenses";
import type { DesktopLicensePayment } from "@/lib/types/desktop-licenses";

function RemovePaymentDialog({
  code,
  payment,
  onRemoved,
}: {
  code: string;
  payment: DesktopLicensePayment;
  onRemoved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const removeMutation = useRemoveDesktopLicensePaymentMutation();

  async function handleConfirm() {
    try {
      const detail = await removeMutation.mutateAsync({
        code,
        paymentId: payment.id,
      });
      toastSuccess({
        title: "Pago quitado",
        description: detail.expiresOn
          ? `Nuevo vencimiento: ${formatDay(detail.expiresOn)}.`
          : "La instalación se queda sin licencia pagada.",
      });
      setOpen(false);
      onRemoved();
    } catch (error) {
      toastError({
        title: "Error",
        description: licenseErrorMessage(
          error,
          "No se pudo quitar el pago. Intenta de nuevo.",
        ),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Quitar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[520px] shadow-lg shadow-destructive/30">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Quitar pago
            </DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
              <p>
                ¿Quitar el pago de{" "}
                <span className="font-bold">
                  {payment.months} {payment.months === 1 ? "mes" : "meses"}
                </span>{" "}
                del {formatDateTimeShort(payment.createdAt)}? Se recalcula el
                vencimiento y se emite una licencia nueva.
              </p>
              <p className="text-muted-foreground">
                Si el PC del cliente no tiene internet, seguirá con la licencia
                anterior hasta que reciba la nueva.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={removeMutation.isPending}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            disabled={removeMutation.isPending}
            onClick={handleConfirm}
          >
            {removeMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Quitando...
              </>
            ) : (
              "Quitar pago"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PaymentsCard({
  code,
  payments,
  onRemoved,
}: {
  code: string;
  payments: DesktopLicensePayment[];
  onRemoved: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-card-foreground">Pagos</CardTitle>
        <CardDescription>Los más recientes primero</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length === 0 ? (
          <div className="px-4 pb-6">
            <Empty className="border-border border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Receipt />
                </EmptyMedia>
                <EmptyTitle>Sin pagos</EmptyTitle>
                <EmptyDescription>
                  Todavía no se ha registrado ningún pago para esta instalación.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3 text-foreground">Fecha</TableHead>
                  <TableHead className="px-4 py-3 text-foreground">Meses</TableHead>
                  <TableHead className="px-4 py-3 text-foreground">Importe</TableHead>
                  <TableHead className="px-4 py-3 text-foreground">Nota</TableHead>
                  <TableHead className="w-[1%] px-4 py-3 text-right text-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDateTimeShort(payment.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">
                      {payment.months}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {formatPaymentAmount(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-normal break-words text-muted-foreground">
                      {payment.note || DASH}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <RemovePaymentDialog
                        code={code}
                        payment={payment}
                        onRemoved={onRemoved}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
