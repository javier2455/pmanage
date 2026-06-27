"use client";

import { Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatMoney } from "@/lib/currency";
import type { CurrencyAccount } from "@/lib/types/currency-account";

/** Umbral relativo bajo el cual se considera el saldo "bajo" (10% del presupuesto). */
const LOW_BALANCE_RATIO = 0.1;

function balanceStatus(balance: number, budget: number) {
  if (balance <= 0) {
    return { label: "Sin saldo", variant: "destructive" as const };
  }
  if (budget > 0 && balance < budget * LOW_BALANCE_RATIO) {
    return { label: "Saldo bajo", variant: "secondary" as const };
  }
  return { label: "Disponible", variant: "outline" as const };
}

interface BalancesTableProps {
  accounts: CurrencyAccount[];
}

export function BalancesTable({ accounts }: BalancesTableProps) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent>
          <Empty className="border-border border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Wallet />
              </EmptyMedia>
              <EmptyTitle>Sin cuentas por moneda</EmptyTitle>
              <EmptyDescription>
                Aún no has inicializado presupuestos. Usa “Inicializar
                presupuestos” para establecer el saldo de cada moneda.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table className="min-w-[560px]">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3 text-foreground">Moneda</TableHead>
              <TableHead className="px-4 py-3 text-right text-foreground">
                Saldo actual
              </TableHead>
              <TableHead className="px-4 py-3 text-right text-foreground">
                Presupuesto inicial
              </TableHead>
              <TableHead className="px-4 py-3 text-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const balance = Number(account.currentBalance);
              const budget = Number(account.initialBudget);
              const status = balanceStatus(balance, budget);
              return (
                <TableRow key={account.id}>
                  <TableCell className="px-4 py-3 font-medium text-foreground">
                    {account.currency}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-foreground">
                    {formatMoney(balance, account.currency)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-muted-foreground">
                    {formatMoney(budget, account.currency)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
