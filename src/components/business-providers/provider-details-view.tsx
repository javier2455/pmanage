"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, Mail, Pencil, Phone, User } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton"
import { useGetProviderByIdQuery } from "@/hooks/use-provider"
import { ProviderProductsTable } from "./provider-products-table"

function formatDate(value: string | null | undefined): string {
  if (!value) return "--"
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

interface DetailRowProps {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}

function DetailRow({ label, icon, children }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
        {children}
      </span>
    </div>
  )
}

export function ProviderDetailsView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const providerId = searchParams.get("id") ?? ""

  const { data, isLoading, isError } = useGetProviderByIdQuery(providerId, {
    refetchOnMount: "always",
  })

  useEffect(() => {
    if (!providerId) {
      router.replace("/dashboard/business/providers")
    }
  }, [providerId, router])

  if (!providerId) return null

  if (isLoading) return <SimpleTableSkeleton />

  const provider = data?.data
  if (isError || !provider) {
    return (
      <p className="text-destructive">No se pudo cargar el proveedor.</p>
    )
  }

  const products = provider.providerProducts ?? []

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-card-foreground">
                {provider.name}
              </CardTitle>
              <CardDescription>
                {provider.description || "Sin descripción"}
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/dashboard/business/providers/edit?id=${provider.id}`}
              >
                <Pencil data-icon="inline-start" />
                Editar
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <DetailRow
              label="Contacto"
              icon={<User className="size-3.5" />}
            >
              {provider.contactName || "--"}
            </DetailRow>

            <DetailRow label="Email" icon={<Mail className="size-3.5" />}>
              {provider.email ? (
                <a
                  href={`mailto:${provider.email}`}
                  className="text-primary underline-offset-2 hover:underline break-all"
                >
                  {provider.email}
                </a>
              ) : (
                "--"
              )}
            </DetailRow>

            <DetailRow label="Teléfono" icon={<Phone className="size-3.5" />}>
              {provider.phone || "--"}
            </DetailRow>

            {provider.business && (
              <DetailRow
                label="Negocio"
                icon={<Building2 className="size-3.5" />}
              >
                {provider.business.name}
              </DetailRow>
            )}

            <DetailRow label="Registrado el">
              <span className="tabular-nums">
                {formatDate(provider.createdAt)}
              </span>
            </DetailRow>

            <DetailRow label="Última actualización">
              <span className="tabular-nums">
                {formatDate(provider.updatedAt)}
              </span>
            </DetailRow>
          </div>
        </CardContent>
      </Card>

      <ProviderProductsTable products={products} />
    </div>
  )
}
