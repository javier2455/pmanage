"use client"

import ExchangeCard from "@/components/exchange-rate/exchange-card";
import { useExchangeRate } from "@/hooks/use-exchange";

export default function ExchangeRatePage() {
  
  const { data, isLoading, isError } = useExchangeRate('34f7137e-25b2-45d0-bde3-8d7d466324e6');

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al cargar las tasas de cambio</div>;
  console.log('response data: ', data);

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
      <div className="grid gap-4 sm:grid-cols-3">
        <ExchangeCard title="Dolar estadounidense" value={data.data.USD} currency="USD" />
        <ExchangeCard title="Euro" value={data.data.EURO} currency="EUR" />
        <ExchangeCard title="Transferencia" value={data.data.CUP_TRANSFERENCIA} currency="CUP_TRANSFERENCIA" />
      </div>
    </section>
  )
}
