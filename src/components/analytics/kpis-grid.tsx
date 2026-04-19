import {
  DollarSign,
  TrendingUp,
  Receipt,
  XCircle,
  Warehouse,
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

  return (
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
        title="Ganancia neta"
        value={data.profit.value}
        change={data.profit.change}
        icon={TrendingUp}
        format="currency"
        description={periodLabel}
        tooltip="Ingresos menos los costos de inventario (precios de entrada). Representa la rentabilidad real del negocio en el período."
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
        tooltip="Capital total invertido actualmente en stock (suma de stock × precio de entrada de cada producto). Ayuda a dimensionar el dinero inmovilizado en inventario."
      />
    </div>
  )
}
