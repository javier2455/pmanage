import Link from "next/link"
import { ArrowLeft, UserPlus } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProviderForm } from "@/components/business-providers/provider-form"

export default function CreateProviderPage() {
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
            Crear proveedor
          </h1>
          <p className="text-muted-foreground">
            Registra un nuevo proveedor y los productos que suministra
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Nuevo proveedor
              </CardTitle>
              <CardDescription>
                Completa la información del proveedor
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProviderForm mode="create" />
        </CardContent>
      </Card>
    </section>
  )
}
