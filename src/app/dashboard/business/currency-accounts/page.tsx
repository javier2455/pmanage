"use client";

import { useState } from "react";

import { useBusiness } from "@/context/business-context";
import { useCurrencyBalances } from "@/hooks/use-currency-account";
import { useExchangeRate } from "@/hooks/use-exchange";
import { useTransactionsByBusiness } from "@/hooks/use-financial-transactions";
import { getAvailableCurrencies } from "@/lib/currency";
import { BalancesTable } from "@/components/currency-account/balances-table";
import { ConsolidatedBalanceCard } from "@/components/currency-account/consolidated-balance-card";
import { InitializeBudgetsDialog } from "@/components/currency-account/initialize-budgets-dialog";
import { TransactionsTable } from "@/components/currency-account/transactions-table";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const TRANSACTIONS_DEFAULT_LIMIT = 10;

export default function CurrencyAccountsPage() {
  const { activeBusinessId } = useBusiness();
  const businessId = activeBusinessId ?? "";

  const {
    data: accounts,
    isLoading,
    isError,
  } = useCurrencyBalances(businessId);

  // Monedas seleccionables del negocio (CUP + las que tengan tasa configurada).
  const { data: exchangeRateData } = useExchangeRate(businessId);
  const availableCurrencies = getAvailableCurrencies(exchangeRateData?.data);

  // Estado del listado de transacciones (paginación + filtro de moneda).
  const [txPage, setTxPage] = useState(1);
  const [txLimit, setTxLimit] = useState(TRANSACTIONS_DEFAULT_LIMIT);
  const [txCurrency, setTxCurrency] = useState("");

  const {
    data: txData,
    isFetching: txIsFetching,
    isError: txIsError,
  } = useTransactionsByBusiness({
    businessId,
    currency: txCurrency || undefined,
    page: txPage,
    limit: txLimit,
  });

  function handleTxCurrencyChange(next: string) {
    setTxCurrency(next);
    setTxPage(1);
  }

  function handleTxLimitChange(next: number) {
    setTxLimit(next);
    setTxPage(1);
  }

  const initializedCurrencies = (accounts ?? []).map((a) => a.currency);

  if (isError) return <div>Error al cargar los saldos por moneda</div>;

  const showInitialSkeleton = isLoading && !accounts;

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Saldos por moneda
          </h1>
          <p className="text-muted-foreground">
            Consulta el saldo disponible de cada moneda y establece sus
            presupuestos iniciales
          </p>
        </div>
        {!!businessId && (
          <InitializeBudgetsDialog
            businessId={businessId}
            availableCurrencies={availableCurrencies}
            initializedCurrencies={initializedCurrencies}
          />
        )}
      </div>

      {showInitialSkeleton ? (
        <SimpleTableSkeleton />
      ) : (
        // La pestaña "Flujo por período" llega en una fase posterior. Ver
        // docs/flujo-de-caja.md.
        <Tabs defaultValue="balances">
          <TabsList>
            <TabsTrigger value="balances">Saldos</TabsTrigger>
            <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          </TabsList>
          <TabsContent value="balances">
            <BalancesTable accounts={accounts ?? []} />
          </TabsContent>
          <TabsContent value="consolidated">
            <ConsolidatedBalanceCard
              accounts={accounts ?? []}
              exchangeRate={exchangeRateData?.data}
            />
          </TabsContent>
          <TabsContent value="transactions">
            {txIsError ? (
              <div className="text-sm text-destructive">
                Error al cargar las transacciones
              </div>
            ) : (
              <TransactionsTable
                transactions={txData?.data ?? []}
                meta={
                  txData?.meta ?? {
                    total: 0,
                    page: txPage,
                    limit: txLimit,
                    totalPages: 0,
                  }
                }
                availableCurrencies={availableCurrencies}
                currency={txCurrency}
                onCurrencyChange={handleTxCurrencyChange}
                isFetching={txIsFetching}
                onPageChange={setTxPage}
                onLimitChange={handleTxLimitChange}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </section>
  );
}
