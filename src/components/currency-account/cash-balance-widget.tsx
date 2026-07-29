"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusiness } from "@/context/business-context";
import { useCurrencyBalances } from "@/hooks/use-currency-account";
import { useExchangeRate } from "@/hooks/use-exchange";
import { BASE_CURRENCY, formatMoney } from "@/lib/currency";
import { consolidateBalances } from "@/lib/cash-flow";

export default function CashBalanceWidget() {
  const { activeBusinessId } = useBusiness();
  const businessId = activeBusinessId ?? "";

  const { data: accounts, isPending } = useCurrencyBalances(businessId);
  const { data: exchangeRateData } = useExchangeRate(businessId);

  // `useCurrencyBalances` lleva `enabled: !!businessId`, y una query deshabilitada
  // reporta `isLoading === false`. Mientras el contexto resuelve el negocio activo
  // había un instante en que se mostraba el estado vacío ("aún no hay cuentas")
  // sin haber consultado todavía.
  const isLoadingBalances = isPending || !businessId;

  const { totalBase, rows, hasUnconvertible } = consolidateBalances(
    accounts ?? [],
    exchangeRateData?.data,
  );

  const hasAccounts = (accounts?.length ?? 0) > 0;

  const card = (
    <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Caja
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoadingBalances && !accounts ? (
          <>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </>
        ) : hasAccounts ? (
          <>
            <div className="text-2xl font-bold text-card-foreground">
              {formatMoney(totalBase, BASE_CURRENCY)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {rows.length} moneda{rows.length === 1 ? "" : "s"}
              {hasUnconvertible ? " · algunas sin tasa" : ""}
            </p>
          </>
        ) : (
          // Nada de enlaces aquí dentro: la tarjeta entera ya es un `<Link>` a
          // los saldos por moneda y anidar anclas es HTML inválido.
          <p className="text-sm text-muted-foreground">
            Aún no hay movimientos en caja. Consulta tus{" "}
            <span className="underline-offset-2 group-hover:underline">
              saldos por moneda
            </span>
            .
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Link
      href="/dashboard/business/currency-accounts"
      aria-label="Ver saldos por moneda"
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {card}
    </Link>
  );
}
