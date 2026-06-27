import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton"
import { ProviderDetailsView } from "@/components/business-providers/provider-details-view"

export default function ProviderDetailsPage() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/providers"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Detalles del proveedor
          </h1>
          <p className="text-muted-foreground">
            Información de contacto y productos suministrados
          </p>
        </div>
      </div>

      <Suspense fallback={<SimpleTableSkeleton />}>
        <ProviderDetailsView />
      </Suspense>
    </section>
  )
}
