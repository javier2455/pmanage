"use client"

import * as React from "react"
import { Store } from "lucide-react"

import { NavMain, type NavItem, type NavSection, type NavSubItem } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetAllSectionsQuery } from "@/hooks/use-navigation"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { useBusiness } from "@/context/business-context"
import { isProRoute } from "@/lib/pro-gates"
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

/**
 * Filtro de visibilidad por rol. Si `roles` está vacío o es null se
 * considera "visible a todos los roles" — alineado con la regla de negocio
 * que permite secciones sin roles asignados.
 */
function isVisibleForRole(roles: string[] | null | undefined, roleId: string) {
  if (!roles || roles.length === 0) return true
  return roles.includes(roleId)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { roleId, isProPlan } = useUserRoleAndPlan()
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
      .filter((s) => isVisibleForRole(s.roles, roleId))
      .map<NavSection>((section) => {
        const items: NavItem[] = (section.menus ?? [])
          .filter((m) => m.active)
          .filter((m) => isVisibleForRole(m.roles, roleId))
          .map<NavItem>((menu) => {
            const subs: NavSubItem[] = (menu.submenus ?? [])
              .filter((s) => s.active)
              .filter((s) => isVisibleForRole(s.roles, roleId))
              .map((s) => {
                const pro = s.badge === "Pro" || isProRoute(s.url)
                return {
                  title: s.name,
                  url: s.url,
                  icon: resolveIcon(s.icon),
                  pro,
                  disabled: hasNoBusinesses || (pro && !isProPlan),
                }
              })

            const pro = menu.badge === "Pro" || isProRoute(menu.url)
            return {
              title: menu.name,
              url: menu.url || "#",
              icon: resolveIcon(menu.icon),
              items: subs.length ? subs : undefined,
              pro,
              disabled: hasNoBusinesses || (pro && !isProPlan),
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
  }, [sections, roleId, isProPlan, hasNoBusinesses])

  return (
    <Sidebar className="" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Store className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GeosGS</span>
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
