"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton"
import { useGetProviderByIdQuery } from "@/hooks/use-provider"
import { ProviderForm } from "./provider-form"

export function EditProviderForm() {
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

  if (isError || !data?.data) {
    return (
      <p className="text-destructive">
        No se pudo cargar el proveedor.
      </p>
    )
  }

  return <ProviderForm mode="edit" provider={data.data} />
}
