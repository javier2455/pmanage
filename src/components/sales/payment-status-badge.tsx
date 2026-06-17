import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/lib/types/sales";
import { CircleCheck, CircleX, Clock, Coins } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CONFIG: Record<
  PaymentStatus,
  { label: string; className: string; icon: LucideIcon }
> = {
  pending: {
    label: "Pendiente de pago",
    className: "bg-amber-500 text-white border border-amber-500",
    icon: Clock,
  },
  partially_paid: {
    label: "Pago parcial",
    className: "bg-sky-500 text-white border border-sky-500",
    icon: Coins,
  },
  paid: {
    label: "Pagada",
    className: "bg-emerald-500 text-white border border-emerald-500",
    icon: CircleCheck,
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-destructive text-destructive-foreground border border-destructive/70",
    icon: CircleX,
  },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="ghost" className={`${cfg.className} ${className ?? ""}`}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

/**
 * Deriva el estado de pago de una venta de forma defensiva mientras el backend
 * confirma que `paymentStatus` viaja en la lista/detalle (ver salvedad del doc §8).
 * Una venta cancelada (`isCancelled`) siempre se muestra como `cancelled`.
 */
export function resolvePaymentStatus(sale: {
  isCancelled?: boolean;
  paymentStatus?: PaymentStatus;
}): PaymentStatus {
  if (sale.isCancelled) return "cancelled";
  return sale.paymentStatus ?? "pending";
}
