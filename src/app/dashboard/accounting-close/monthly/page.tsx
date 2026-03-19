"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function MonthlyPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Cierre Mensual
        </h1>
        <p className="text-muted-foreground">
          Resumen contable del mes
        </p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Construction className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                En desarrollo
              </CardTitle>
              <CardDescription>
                Esta funcionalidad esta siendo desarrollada por el equipo de trabajo. Estara disponible proximamente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  )
}
