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
import { currencyLabel, formatMoney } from "@/lib/currency";
import type { CurrencyAccount } from "@/lib/types/currency-account";

/**
 * El estado depende solo del saldo. Antes existía un tercer nivel ("Saldo bajo")
 * calculado contra el presupuesto inicial; al retirarse esa columna de la vista,
 * ese estado quedaba justificado por un dato que el usuario ya no puede ver.
 */
function balanceStatus(balance: number) {
  if (balance <= 0) {
    return { label: "Sin saldo", variant: "destructive" as const };
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
                La cuenta de cada moneda se crea sola con el primer movimiento
                que la use: una venta, un gasto o una entrada de inventario.
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
        <Table className="min-w-100">
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-3 text-foreground">Moneda</TableHead>
              <TableHead className="px-4 py-3 text-right text-foreground">
                Saldo actual
              </TableHead>
              <TableHead className="px-4 py-3 text-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => {
              const balance = Number(account.currentBalance);
              const status = balanceStatus(balance);
              return (
                <TableRow key={account.id}>
                  <TableCell className="px-4 py-3 font-medium text-foreground">
                    {currencyLabel(account.currency)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-foreground">
                    {formatMoney(balance, account.currency)}
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
