"use client"

import * as React from "react"

import { NegoraLogo } from "@/components/brand/negora-logo"
import { NavMain, type NavItem, type NavSection, type NavSubItem } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetAllSectionsQuery } from "@/hooks/use-navigation"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { useBusiness } from "@/context/business-context"
import { requiredFeatureFor } from "@/lib/pro-gates"
import { canAccessNode } from "@/lib/navigation-access"
import { resolveIcon } from "@/lib/icon-map"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { roleId, isProPlan, hasFeature } = useUserRoleAndPlan()

  /**
   * ¿Está bloqueada esta entrada del menú para el plan actual?
   *
   * Si la ruta declara una capacidad concreta (`PRO_ROUTES`), esa manda. Si solo
   * viene marcada con el badge "Pro" desde la gestión de menús —donde no hay
   * forma de nombrar una capacidad— se recae en el gate binario.
   */
  const isLockedByPlan = React.useCallback(
    (url: string | null | undefined, badgedPro: boolean) => {
      const required = requiredFeatureFor(url ?? "")
      if (required) return !hasFeature(required)
      return badgedPro && !isProPlan
    },
    [hasFeature, isProPlan],
  )
  const { activeBusiness, businesses, isLoading: isLoadingBusinesses } = useBusiness()
  const hasNoBusinesses = !isLoadingBusinesses && businesses.length === 0
  const businessIdForMenu = activeBusiness?.isWorker ? activeBusiness.id : undefined

  /* Si hay negocios, esperamos a que el negocio activo esté resuelto antes de
     pedir las secciones. Así, cuando se entra como trabajador, la primera (y
     única) petición ya incluye el businessId y el backend devuelve los
     permisos correctos en vez de fetchear primero sin él. */
  const isActiveBusinessResolved = businesses.length === 0 || !!activeBusiness

  const { data: sections, isLoading } = useGetAllSectionsQuery({
    businessId: businessIdForMenu,
    enabled: !isLoadingBusinesses && isActiveBusinessResolved,
  })

  const navSections = React.useMemo<NavSection[]>(() => {
    if (!sections) return []

    return sections
      .filter((s) => s.active)
      .filter((s) => canAccessNode(s, roleId))
      .map<NavSection>((section) => {
        const items: NavItem[] = (section.menus ?? [])
          .filter((m) => m.active)
          .filter((m) => canAccessNode(m, roleId))
          .map<NavItem>((menu) => {
            const subs: NavSubItem[] = (menu.submenus ?? [])
              .filter((s) => s.active)
              .filter((s) => canAccessNode(s, roleId))
              .map((s) => {
                /* El badge anuncia "esto no lo tienes", no "esto es de pago":
                   marcarlo por ruta hacía que un plan que sí concede la
                   capacidad la viera igualmente etiquetada como Pro. */
                const lockedByPlan = isLockedByPlan(s.url, s.badge === "Pro")
                return {
                  title: s.name,
                  url: s.url,
                  icon: resolveIcon(s.icon),
                  pro: lockedByPlan,
                  disabled: hasNoBusinesses || lockedByPlan,
                }
              })

            const lockedByPlan = isLockedByPlan(menu.url, menu.badge === "Pro")
            return {
              title: menu.name,
              url: menu.url || "#",
              icon: resolveIcon(menu.icon),
              items: subs.length ? subs : undefined,
              pro: lockedByPlan,
              disabled: hasNoBusinesses || lockedByPlan,
            }
          })
          .filter((item) => item.url !== "#" || (item.items && item.items.length > 0))

        return {
          id: section.id,
          title: section.name,
          items,
        }
      })
      .filter((section) => section.items.length > 0)
  }, [sections, roleId, isLockedByPlan, hasNoBusinesses])

  return (
    <Sidebar className="" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:justify-center">
              <Link href="/dashboard">
                <NegoraLogo className="size-8 shrink-0 rounded-lg" />
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">Negora</span>
                  <span className="truncate text-xs">Sistema de Gestión</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isLoadingBusinesses || !isActiveBusinessResolved || isLoading ? (
          <NavMainSkeleton />
        ) : (
          <NavMain sections={navSections} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavMainSkeleton() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {Array.from({ length: 6 }).map((_, i) => (
          <SidebarMenuItem key={i}>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
