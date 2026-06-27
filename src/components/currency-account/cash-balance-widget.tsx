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

  const { data: accounts, isLoading } = useCurrencyBalances(businessId);
  const { data: exchangeRateData } = useExchangeRate(businessId);

  const { totalBase, rows, hasUnconvertible } = consolidateBalances(
    accounts ?? [],
    exchangeRateData?.data,
  );

  const hasAccounts = (accounts?.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Caja
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading && !accounts ? (
          <Skeleton className="h-8 w-32" />
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
          <p className="text-sm text-muted-foreground">
            <Link
              href="/dashboard/business/currency-accounts"
              className="underline-offset-2 hover:underline"
            >
              Inicializa tus presupuestos
            </Link>{" "}
            para ver tu caja.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
