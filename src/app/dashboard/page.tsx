import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react"

const stats = [
  {
    title: "Ventas del dia",
    value: "$12,450.00",
    change: "+12.5%",
    icon: DollarSign,
    positive: true,
  },
  {
    title: "Transacciones",
    value: "148",
    change: "+8.2%",
    icon: ShoppingCart,
    positive: true,
  },
  {
    title: "Clientes nuevos",
    value: "24",
    change: "+4.1%",
    icon: Users,
    positive: true,
  },
  {
    title: "Ticket promedio",
    value: "$84.12",
    change: "-2.3%",
    icon: TrendingUp,
    positive: false,
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 ">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Panel Principal
        </h1>
        <p className="text-muted-foreground">
          Resumen general de tu negocio
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
              <p
                className={
                  stat.positive
                    ? "text-xs text-emerald-600 dark:text-emerald-500 mt-1"
                    : "text-xs text-red-600 dark:text-red-500 mt-1"
                }
              >
                {stat.change} respecto a ayer
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">Ventas recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[
                { client: "Maria Garcia", amount: "$250.00", time: "Hace 5 min" },
                { client: "Juan Lopez", amount: "$180.50", time: "Hace 15 min" },
                { client: "Ana Rodriguez", amount: "$320.00", time: "Hace 30 min" },
                { client: "Carlos Perez", amount: "$95.00", time: "Hace 1 hora" },
                { client: "Laura Martinez", amount: "$410.25", time: "Hace 2 horas" },
              ].map((sale) => (
                <div
                  key={sale.client}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{sale.client}</p>
                    <p className="text-xs text-muted-foreground">{sale.time}</p>
                  </div>
                  <span className="text-sm font-semibold text-card-foreground">{sale.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {[
                { action: "Nuevo ingreso registrado", detail: "Factura #1042", time: "Hace 10 min" },
                { action: "Cierre diario completado", detail: "Balance: $8,240.00", time: "Hace 3 horas" },
                { action: "Tipo de cambio actualizado", detail: "USD/MXN: 17.25", time: "Hace 5 horas" },
                { action: "Venta anulada", detail: "Factura #1038", time: "Hace 6 horas" },
                { action: "Cliente registrado", detail: "Empresa ABC S.A.", time: "Ayer" },
              ].map((activity) => (
                <div
                  key={activity.action}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
