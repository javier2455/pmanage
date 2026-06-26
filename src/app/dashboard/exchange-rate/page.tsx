"use client"

import ExchangeCard from "@/components/exchange-rate/exchange-card";
import ExchangeRateForm from "@/components/exchange-rate/exchange-rate-form";
import { useBusiness } from "@/context/business-context";
import { useExchangeRate } from "@/hooks/use-exchange";
import { EXCHANGE_CURRENCIES, KNOWN_CURRENCY_CODES } from "@/lib/currency";

export default function ExchangeRatePage() {
  const { activeBusinessId } = useBusiness();
  const { data, isLoading, isError } = useExchangeRate(activeBusinessId ?? '');

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al cargar las tasas de cambio</div>;

  const exchange = data?.data;
  const activeCurrencies = exchange
    ? KNOWN_CURRENCY_CODES.filter((code) => Number(exchange[code]) > 0)
    : [];
  const labelByCode = new Map(EXCHANGE_CURRENCIES.map((c) => [c.code, c.label]));

  return (
    <section className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tasa de cambio
        </h1>
        <p className="text-muted-foreground">
          Consulta y actualiza las tasas de cambio vigentes
        </p>
      </div>
      {activeCurrencies.length > 0 && exchange && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeCurrencies.map((code) => (
            <ExchangeCard
              key={code}
              title={labelByCode.get(code) ?? code}
              value={Number(exchange[code])}
              currency={code}
            />
          ))}
        </div>
      )}
      <ExchangeRateForm
        businessId={activeBusinessId ?? ''}
        currentData={data?.data ?? null}
      />
    </section>
  )
}
