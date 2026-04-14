"use client"

import ExchangeCard from "@/components/exchange-rate/exchange-card";
import ExchangeRateForm from "@/components/exchange-rate/exchange-rate-form";
import { useBusiness } from "@/context/business-context";
import { useExchangeRate } from "@/hooks/use-exchange";

export default function ExchangeRatePage() {
  const { activeBusinessId } = useBusiness();
  const { data, isLoading, isError } = useExchangeRate(activeBusinessId ?? '');

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al cargar las tasas de cambio</div>;

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
      {data?.data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <ExchangeCard title="Dolar estadounidense" value={data.data.USD} currency="USD" />
          <ExchangeCard title="Euro" value={data.data.EURO} currency="EUR" />
          <ExchangeCard title="Transferencia" value={data.data.CUP_TRANSFERENCIA} currency="CUP_TRANSFERENCIA" />
        </div>
      )}
      <ExchangeRateForm
        businessId={activeBusinessId ?? ''}
        currentData={data?.data ?? null}
      />
    </section>
  )
}
