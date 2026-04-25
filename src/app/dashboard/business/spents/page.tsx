import { HandCoins } from "lucide-react"

export default function SpentPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <HandCoins className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Gastos</h1>
        <p className="text-muted-foreground">En desarrollo</p>
      </div>
    </div>
  )
}
