"use client"

import { useBusiness } from "@/context/business-context"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronsUpDown, Store, Plus, Truck, Lock } from "lucide-react"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { ProBadge } from "@/components/ui/pro-badge"
import { Badge } from "@/components/ui/badge"

export function BusinessSwitcher() {
  const router = useRouter()
  const { businesses, archivedBusinesses, setActiveBusinessId, activeBusiness, isLoading } =
    useBusiness()
  // El tope viene de plan.limits.maxBusinesses del backend (con fallback local);
  // solo cuenta negocios activos (`businesses` ya excluye los archivados).
  const { maxBusinesses } = useUserRoleAndPlan()

  const canAddBusiness = businesses.length < maxBusinesses

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label="Seleccionar negocio"
          className="w-52 justify-between border-border bg-card text-foreground hover:bg-muted sm:w-64"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
              <Store className="size-3" />
            </div>
            <span className="truncate text-sm">
              {isLoading ? "Cargando..." : activeBusiness?.name ?? "Seleccionar negocio"}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="center">
        <DropdownMenuLabel>Tus negocios</DropdownMenuLabel>
        <DropdownMenuGroup>
          {businesses.map((business) => (
            <DropdownMenuItem
              key={business.id}
              onClick={() => setActiveBusinessId(business.id)}
              className="flex cursor-pointer items-center gap-2"
            >
              <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                <Store className="size-3" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-sm">{business.name}</span>
              </div>
              {business.acceptsMessaging && (
                <Badge
                  variant="secondary"
                  className="gap-1 px-1.5 py-0 text-[10px] font-medium"
                >
                  <Truck className="size-2.5" />
                  Delivery
                </Badge>
              )}
              <Check
                className={cn(
                  "ml-auto size-4 shrink-0",
                  activeBusiness?.id === business.id
                    ? "opacity-100 text-primary"
                    : "opacity-0",
                )}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {archivedBusinesses.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground">
              Archivados
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {archivedBusinesses.map((business) => (
                <DropdownMenuItem
                  key={business.id}
                  disabled
                  className="flex cursor-not-allowed items-center gap-2 opacity-60"
                >
                  <div className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
                    <Lock className="size-3" />
                  </div>
                  <span className="flex-1 truncate text-sm">{business.name}</span>
                  <Badge
                    variant="secondary"
                    className="gap-1 px-1.5 py-0 text-[10px] font-medium"
                  >
                    Recupéralo con Pro
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => canAddBusiness && router.push("/dashboard/business/create")}
          disabled={!canAddBusiness}
          className={cn(
            "flex items-center gap-2",
            canAddBusiness ? "cursor-pointer text-muted-foreground" : "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus className="size-4" />
          <span className="text-sm">Agregar negocio</span>
          <ProBadge />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
