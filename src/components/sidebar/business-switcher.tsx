"use client"

import { useBusiness } from "@/context/business-context"
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
import { Check, ChevronsUpDown, Store, Plus } from "lucide-react"


export function BusinessSwitcher() {
  const { businesses, setActiveBusinessId, activeBusiness, isLoading } =
    useBusiness()

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
                {/* <span className="text-xs text-muted-foreground">
                  {business.}
                </span> */}
              </div>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex cursor-pointer items-center gap-2 text-muted-foreground">
          <Plus className="size-4" />
          <span className="text-sm">Agregar negocio</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
