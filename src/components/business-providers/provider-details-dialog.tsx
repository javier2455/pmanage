"use client"

import * as React from "react"
import { Building2, Mail, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGetProviderByIdQuery } from "@/hooks/use-provider"
import { Money } from "@/components/ui/currency/money"

interface ProviderDetailsDialogProps {
  providerId: string
  tooltip?: string
  trigger?: React.ReactNode
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "--"
  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function ProviderDetailsDialog({
  providerId,
  tooltip,
  trigger,
}: ProviderDetailsDialogProps) {
  const [open, setOpen] = React.useState(false)

  const { data, isLoading } = useGetProviderByIdQuery(providerId, {
    refetchOnMount: "always",
  })

  const provider = data?.data
  const products = provider?.providerProducts ?? []
  const triggerContent = trigger ?? (
    <Button variant="outline">Ver detalles</Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {tooltip ? (
          <span className="inline-flex">
            <Tooltip>
              <TooltipTrigger asChild>{triggerContent}</TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </span>
        ) : (
          triggerContent
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] md:max-w-[560px] shadow-lg shadow-cyan-300/30">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            Detalles del proveedor
          </DialogTitle>
          <DialogDescription>
            Información de contacto y productos suministrados
          </DialogDescription>
        </DialogHeader>

        {isLoading || !provider ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        ) : (
          <div className="flex flex-col mt-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-start justify-between border-b border-border py-4 first:pt-0">
              <span className="text-sm text-muted-foreground">Nombre</span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                {provider.name}
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="text-sm text-muted-foreground">Descripción</span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                {provider.description || "--"}
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="size-3.5" />
                Contacto
              </span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                {provider.contactName || "--"}
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                Email
              </span>
              {provider.email ? (
                <a
                  href={`mailto:${provider.email}`}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline text-right max-w-[60%] break-all"
                >
                  {provider.email}
                </a>
              ) : (
                <span className="text-sm font-medium text-card-foreground">
                  --
                </span>
              )}
            </div>

            <div className="flex items-start justify-between border-b border-border py-4">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" />
                Teléfono
              </span>
              <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                {provider.phone || "--"}
              </span>
            </div>

            {provider.business && (
              <div className="flex items-start justify-between border-b border-border py-4">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="size-3.5" />
                  Negocio
                </span>
                <span className="text-sm font-medium text-card-foreground text-right max-w-[60%]">
                  {provider.business.name}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm text-muted-foreground">
                Registrado el
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {formatDate(provider.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border py-4">
              <span className="text-sm text-muted-foreground">
                Última actualización
              </span>
              <span className="text-sm font-medium text-card-foreground tabular-nums">
                {formatDate(provider.updatedAt)}
              </span>
            </div>

            <div className="pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-card-foreground">
                  Productos suministrados
                </span>
                <Badge variant="secondary" className="text-xs">
                  {products.length}
                </Badge>
              </div>

              {products.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                  Este proveedor aún no tiene productos asociados.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {products.map((pp) => (
                    <li
                      key={pp.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-medium text-card-foreground">
                          {pp.product.name}
                        </span>
                        {pp.product.unit && (
                          <span className="text-xs text-muted-foreground">
                            Unidad: {pp.product.unit}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-card-foreground">
                        <Money valueCUP={Number(pp.price)} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
