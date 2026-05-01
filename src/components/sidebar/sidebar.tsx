"use client"

import * as React from "react"
import { Store } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetAllMenuItemsQuery } from "@/hooks/use-menu"
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

type NavSubItem = {
  title: string
  url: string
  icon?: LucideIcon
  pro?: boolean
  disabled?: boolean
}

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  pro?: boolean
  disabled?: boolean
  items?: NavSubItem[]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { roleId, isProPlan } = useUserRoleAndPlan()
  const { activeBusiness, businesses, isLoading: isLoadingBusinesses } = useBusiness()
  const hasNoBusinesses = !isLoadingBusinesses && businesses.length === 0
  const businessIdForMenu = activeBusiness?.isWorker ? activeBusiness.id : undefined

  const { data: menu, isLoading } = useGetAllMenuItemsQuery({
    businessId: businessIdForMenu,
    enabled: !isLoadingBusinesses,
  })

  const navMain = React.useMemo<NavItem[]>(() => {
    if (!menu) return []
    return menu
      .filter((item) => item.active)
      .filter((item) => !item.roles || item.roles.includes(roleId))
      .map<NavItem>((item) => {
        const subs: NavSubItem[] = (item.submenus ?? [])
          .filter((s) => s.active)
          .filter((s) => !s.roles || s.roles.includes(roleId))
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

        const pro = item.badge === "Pro" || isProRoute(item.url)
        return {
          title: item.name,
          url: item.url || "#",
          icon: resolveIcon(item.icon),
          items: subs.length ? subs : undefined,
          pro,
          disabled: hasNoBusinesses || (pro && !isProPlan),
        }
      })
      .filter((item) => !item.items || item.items.length > 0)
  }, [menu, roleId, isProPlan, hasNoBusinesses])

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
        {isLoading ? <NavMainSkeleton /> : <NavMain items={navMain} />}
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
