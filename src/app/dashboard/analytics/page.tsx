"use client"

import { BarChart3, Construction } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AnalyticsPage() {
  return (
    <section className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analítica
        </h1>
        <p className="text-muted-foreground">
          Estadísticas y métricas de tu negocio
        </p>
      </div>
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex items-center justify-center rounded-full bg-muted p-4">
            <Construction className="size-10 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">En desarrollo</h2>
            <p className="text-sm text-muted-foreground">
              Esta sección estará disponible próximamente. Estamos trabajando para
              traerte las mejores herramientas de análisis para tu negocio.
            </p>
          </div>
          <BarChart3 className="size-6 text-muted-foreground/40" />
        </CardContent>
      </Card>
    </section>
  )
}
