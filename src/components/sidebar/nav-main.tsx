"use client"

import * as React from "react"
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

export type NavSubItem = {
  title: string
  url: string
  icon?: LucideIcon
  pro?: boolean
  disabled?: boolean
}

export type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  pro?: boolean
  disabled?: boolean
  items?: NavSubItem[]
}

export type NavSection = {
  id: string
  title: string
  items: NavItem[]
}

export function NavMain({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname()

  const activeUrl = React.useMemo(() => {
    const allUrls = sections
      .flatMap((s) => s.items)
      .flatMap((item) => [
        item.url,
        ...(item.items?.map((sub) => sub.url) ?? []),
      ])
      .filter((url) => url && url !== "#")

    return allUrls
      .filter((url) => pathname === url || pathname.startsWith(url + "/"))
      .sort((a, b) => b.length - a.length)[0]
  }, [sections, pathname])

  const isPathActive = (url: string) => url === activeUrl

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({})

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.id}>
          <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) =>
              item.items && item.items.length > 0 ? (
                <Collapsible
                  key={`${section.id}-${item.title}`}
                  asChild
                  open={
                    item.items.some((sub) => sub.url === activeUrl) ||
                    (openGroups[`${section.id}-${item.title}`] ?? false)
                  }
                  onOpenChange={(open) =>
                    setOpenGroups((prev) => ({
                      ...prev,
                      [`${section.id}-${item.title}`]: open,
                    }))
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
                        {item.items.map((subItem, subIndex) => (
                          <SidebarMenuSubItem
                            key={`${section.id}-${item.title}-${subItem.title}-${subIndex}`}
                          >
                            <SidebarMenuSubButton
                              asChild={!subItem.disabled}
                              isActive={isPathActive(subItem.url) && !subItem.disabled}
                              className={cn(
                                subItem.disabled && "pointer-events-none opacity-50 cursor-not-allowed"
                              )}
                            >
                              {subItem.disabled ? (
                                <>
                                  {subItem.icon && <subItem.icon className="size-4" />}
                                  <span>{subItem.title}</span>
                                  {subItem.pro && <ProBadge />}
                                </>
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
                <SidebarMenuItem key={`${section.id}-${item.title}`}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    tooltip={item.title}
                    isActive={isPathActive(item.url) && !item.disabled}
                    className={cn(
                      item.disabled && "pointer-events-none opacity-50 cursor-not-allowed"
                    )}
                  >
                    {item.disabled ? (
                      <>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.pro && <ProBadge />}
                      </>
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
      ))}
    </>
  )
}
