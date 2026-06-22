"use client";

import { useBusiness } from "@/context/business-context";
import { useCurrencyBalances } from "@/hooks/use-currency-account";
import { useExchangeRate } from "@/hooks/use-exchange";
import { getAvailableCurrencies } from "@/lib/currency";
import { BalancesTable } from "@/components/currency-account/balances-table";
import { ConsolidatedBalanceCard } from "@/components/currency-account/consolidated-balance-card";
import { InitializeBudgetsDialog } from "@/components/currency-account/initialize-budgets-dialog";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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
        // Las pestañas "Movimientos" y "Flujo por período" llegan en Fase 2:
        // dependen de un endpoint de movimientos que el backend aún no expone.
        // Ver docs/flujo-de-caja.md.
        <Tabs defaultValue="balances">
          <TabsList>
            <TabsTrigger value="balances">Saldos</TabsTrigger>
            <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
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
        </Tabs>
      )}
    </section>
  );
}
