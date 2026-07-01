"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle, Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { BASE_CURRENCY, currencyLabel, formatMoney } from "@/lib/currency";
import type { ExchangeRateLike } from "@/lib/currency";
import { consolidateBalances } from "@/lib/cash-flow";
import type { CurrencyAccount } from "@/lib/types/currency-account";

interface ConsolidatedBalanceCardProps {
  accounts: CurrencyAccount[];
  exchangeRate: ExchangeRateLike;
}

export function ConsolidatedBalanceCard({
  accounts,
  exchangeRate,
}: ConsolidatedBalanceCardProps) {
  const { totalBase, rows, hasUnconvertible } = useMemo(
    () => consolidateBalances(accounts, exchangeRate),
    [accounts, exchangeRate],
  );

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty className="border-border border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>Nada que consolidar</EmptyTitle>
              <EmptyDescription>
                Inicializa los presupuestos de tus monedas para ver el total de
                caja consolidado.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total en caja
        </CardTitle>
        <CardDescription className="text-3xl font-bold text-card-foreground">
          {formatMoney(totalBase, BASE_CURRENCY)}
        </CardDescription>
        <p className="text-xs text-muted-foreground">
          Suma de todos los saldos convertidos a {BASE_CURRENCY} con el tipo de
          cambio actual.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.map((row) => {
          const share =
            row.convertible && totalBase > 0 && row.baseEquivalent != null
              ? (row.baseEquivalent / totalBase) * 100
              : null;
          return (
            <div
              key={row.currency}
              className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {currencyLabel(row.currency)}
                </span>
                {!row.convertible && (
                  <Badge variant="secondary">Sin tasa</Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {formatMoney(row.balance, row.currency)}
                </p>
                {row.convertible && row.baseEquivalent != null ? (
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(row.baseEquivalent, BASE_CURRENCY)}
                    {share != null ? ` · ${share.toFixed(1)}%` : null}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No incluida en el total
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {hasUnconvertible && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Hay monedas con saldo sin tipo de cambio configurado, por lo que no
              se incluyen en el total. Configúralo en{" "}
              <Link
                href="/dashboard/exchange-rate"
                className="underline-offset-2 hover:underline"
              >
                Tipo de cambio
              </Link>
              .
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
