"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  ShoppingBag,
  Warehouse,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ArrowLeftRight,
  Store,
  Settings,
  BadgeDollarSign,
  BarChart3,
  HandCoins,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan"
import { useBusiness } from "@/context/business-context"
import { isProRoute } from "@/lib/pro-gates"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

type NavSubItem = {
  title: string
  url: string
  icon?: LucideIcon
}

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  hidden?: boolean
  items?: NavSubItem[]
}

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "Panel Principal",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Negocio",
      url: "#",
      icon: ShoppingCart,
      items: [
        {
          title: "Detalles",
          url: "/dashboard/business/details",
          icon: FileText,
        },
        {
          title: "Productos",
          url: "/dashboard/business/products",
          icon: Package,
        },
        {
          title: "Ventas",
          url: "/dashboard/business/sales",
          icon: ShoppingBag,
        },
        {
          title: "Gastos",
          url: "/dashboard/business/spents",
          icon: HandCoins,
        },
        {
          title: "Inventario",
          url: "/dashboard/business/inventory",
          icon: Warehouse,
        },
      ],
    },
    {
      title: "Cierre Contable",
      url: "#",
      icon: CalendarCheck,
      items: [
        {
          title: "Diario",
          url: "/dashboard/accounting-close/daily",
          icon: CalendarDays,
        },
        {
          title: "Mensual",
          url: "/dashboard/accounting-close/monthly",
          icon: CalendarRange,
        },
      ],
    },
    {
      title: "Analítica",
      url: "/dashboard/analytics",
      icon: BarChart3,
      hidden: true,
    },
    {
      title: "Tipo de Cambio",
      url: "/dashboard/exchange-rate",
      icon: ArrowLeftRight,
    },
    {
      title: "Administrar",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "Asignar Planes",
          url: "/dashboard/admin/assign-plans",
          icon: BadgeDollarSign,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isAdmin, isProPlan } = useUserRoleAndPlan()
  const { businesses, isLoading: isLoadingBusinesses } = useBusiness()
  const hasNoBusinesses = !isLoadingBusinesses && businesses.length === 0

  const filteredNavMain = React.useMemo(() => {
    return data.navMain
      .filter((item) => {
        if (item.hidden) return false
        if (item.title === "Administrar") return isAdmin
        return true
      })
      .map((item) => {
        if (item.items) {
          const itemsWithDisabled = item.items.map((sub) => {
            const pro = isProRoute(sub.url)
            return {
              ...sub,
              pro,
              disabled: hasNoBusinesses || (pro ? !isProPlan : false),
            }
          })
          return { ...item, items: itemsWithDisabled, disabled: hasNoBusinesses }
        }
        const pro = isProRoute(item.url)
        return { ...item, pro, disabled: hasNoBusinesses || (pro ? !isProPlan : false) }
      })
      .filter((item) => !item.items || item.items.length > 0)
  }, [isAdmin, isProPlan, hasNoBusinesses])

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
        <NavMain items={filteredNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
