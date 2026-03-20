"use client"

import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { PRO_STYLE } from "@/components/assign-plans/utils"
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
                  <SidebarMenuButton tooltip={item.title}>
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
                              {subItem.pro && (
                                <span className={cn("ml-auto", PRO_STYLE.className)}>
                                  <PRO_STYLE.icon className="size-2.5" />
                                  Pro
                                </span>
                              )}
                            </span>
                          ) : (
                            <Link href={subItem.url}>
                              {subItem.icon && <subItem.icon className="size-4" />}
                              <span>{subItem.title}</span>
                              {subItem.pro && (
                                <span className={cn("ml-auto", PRO_STYLE.className)}>
                                  <PRO_STYLE.icon className="size-2.5" />
                                  Pro
                                </span>
                              )}
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
                asChild
                tooltip={item.title}
                isActive={pathname === item.url}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
