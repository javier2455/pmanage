"use client"

import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ProBadge } from "@/components/ui/pro-badge"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    pro?: boolean
    disabled?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
      pro?: boolean
      disabled?: boolean
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={
                item.isActive ||
                item.items.some((sub) => pathname === sub.url)
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn(
                      item.disabled && "pointer-events-none opacity-50 cursor-not-allowed"
                    )}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild={!subItem.disabled}
                          isActive={pathname === subItem.url && !subItem.disabled}
                          className={cn(
                            subItem.disabled && "pointer-events-none opacity-50 cursor-not-allowed"
                          )}
                        >
                          {subItem.disabled ? (
                            <span className="flex flex-1 items-center gap-2 px-2 py-1.5">
                              {subItem.icon && <subItem.icon className="size-4" />}
                              <span>{subItem.title}</span>
                              {subItem.pro && <ProBadge />}
                            </span>
                          ) : (
                            <Link href={subItem.url}>
                              {subItem.icon && <subItem.icon className="size-4" />}
                              <span>{subItem.title}</span>
                              {subItem.pro && <ProBadge />}
                            </Link>
                          )}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={!item.disabled}
                tooltip={item.title}
                isActive={pathname === item.url && !item.disabled}
                className={cn(
                  item.disabled && "pointer-events-none opacity-50 cursor-not-allowed"
                )}
              >
                {item.disabled ? (
                  <span>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.pro && <ProBadge />}
                  </span>
                ) : (
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.pro && <ProBadge />}
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
