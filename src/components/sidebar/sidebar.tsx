"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ShoppingCart,
  // PackageOpen,
  CalendarCheck,
  // CalendarRange,
  ArrowLeftRight,
  Store,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
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

const data = {
  user: {
    name: "Admin",
    email: "admin@ventaspro.com",
    avatar: "",
  },
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
          title: "Ventas",
          url: "/dashboard/business/sales",
        },
        {
          title: "Ingresos",
          url: "/dashboard/business/entries",
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
        },
        {
          title: "Mensual",
          url: "/dashboard/accounting-close/monthly",
        },
      ],
    },
    {
      title: "Tipo de Cambio",
      url: "/dashboard/exchange-rate",
      icon: ArrowLeftRight,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className=""  collapsible="icon" {...props}>
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
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
