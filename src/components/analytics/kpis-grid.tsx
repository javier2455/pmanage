import {
  DollarSign,
  TrendingUp,
  XCircle,
  Warehouse,
  PackageMinus,
  Info,
} from "lucide-react"

import { KpiCard } from "./kpi-card"
import type { KPIsResponse, AnalyticsPeriod } from "@/lib/types/analytics"

interface KpisGridProps {
  data: KPIsResponse
  period: AnalyticsPeriod
}

const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  week: "vs semana anterior",
  month: "vs mes anterior",
  quarter: "vs trimestre anterior",
}

export function KpisGrid({ data, period }: KpisGridProps) {
  const periodLabel = PERIOD_LABEL[period]
  // Ventas del período sin costo conocido: las anteriores al costeo por capas.
  // Se excluyen del costo en vez de contarse como cero, así que mientras haya
  // alguna la ganancia mostrada se queda corta y hay que decirlo.
  const uncostedItems = data.costCoverage?.uncostedItems ?? 0

  return (
    <>
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4 3xl:grid-cols-5">
      <KpiCard
        title="Ingresos"
        value={data.revenue.value}
        change={data.revenue.change}
        icon={DollarSign}
        format="currency"
        description={periodLabel}
        tooltip="Suma del total de todas las ventas realizadas en el período, sin incluir ventas canceladas. Indica cuánto dinero ha facturado el negocio."
      />
      <KpiCard
        title="Ganancia bruta"
        value={data.profit.value}
        change={data.profit.change}
        icon={TrendingUp}
        format="currency"
        description={periodLabel}
        tooltip="Ingresos menos el costo real de la mercancía vendida, tomado del costo con el que entró cada unidad al almacén. No incluye gastos operativos."
      />
      <KpiCard
        title="Costo de lo vendido"
        value={data.costOfGoodsSold.value}
        change={data.costOfGoodsSold.change}
        icon={PackageMinus}
        format="currency"
        variant="inverse"
        description={periodLabel}
        tooltip="Lo que costó comprar la mercancía que salió del almacén en el período. Se calcula con el costo del lote del que salió cada unidad, no con el último precio de compra."
      />
      {/* <KpiCard
        title="Ticket promedio"
        value={data.avgTicket.value}
        change={data.avgTicket.change}
        icon={Receipt}
        format="currency"
        description={periodLabel}
        tooltip="Valor promedio gastado por transacción (ingresos totales dividido entre el número de ventas). Útil para identificar si los clientes están comprando más o menos por visita."
      /> */}
      <KpiCard
        title="Tasa de cancelación"
        value={data.cancellationRate.value}
        change={data.cancellationRate.change}
        icon={XCircle}
        format="percent"
        variant="inverse"
        description={periodLabel}
        tooltip="Porcentaje de ventas canceladas respecto al total de ventas en el período. Un valor alto puede indicar problemas operativos, de stock o de satisfacción del cliente. Bajar este valor es positivo."
      />
      <KpiCard
        title="Valor del inventario"
        value={data.inventoryValue.value}
        change={data.inventoryValue.change}
        icon={Warehouse}
        format="currency"
        description={periodLabel}
        tooltip="Capital invertido en el stock actual, valorando cada unidad al costo del lote del que proviene. Ayuda a dimensionar el dinero inmovilizado en inventario."
      />
    </div>

    {uncostedItems > 0 && (
      <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          {uncostedItems === 1
            ? "1 venta del período no tiene costo registrado y queda fuera del cálculo."
            : `${uncostedItems} ventas del período no tienen costo registrado y quedan fuera del cálculo.`}{" "}
          La ganancia mostrada es mayor que la real.
        </span>
      </p>
    )}
    </>
  )
}
