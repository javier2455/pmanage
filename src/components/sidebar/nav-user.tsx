"use client"

import { useState, useEffect } from "react"
import packageJson from "../../../package.json"
import {
    ChevronsUpDown,
    LogOut,
    Settings,
    Moon,
    Sun,
    User,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    // DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"

export function NavUser() {
    const router = useRouter()
    const { isMobile } = useSidebar()
    const { setTheme, theme } = useTheme()
    const [user, setUser] = useState<{ name?: string; email?: string }>({})

    useEffect(() => {
        const stored = sessionStorage.getItem("user")
        const parsed = stored ? JSON.parse(stored) : {}
        queueMicrotask(() => setUser(parsed))
    }, [])

    const userName = user.name || ""
    const userEmail = user.email || ""

    function handleLogout() {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("activeBusinessId");
        router.push("/login");
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                                    {userName
                                        .split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{userName}</span>
                                <span className="truncate text-xs">{userEmail}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuGroup>
                            {/* <DropdownMenuItem className="cursor-pointer">
                                <User className="mr-2 size-4" />
                                Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <Settings className="mr-2 size-4" />
                                Configuracion
                            </DropdownMenuItem> */}
                            <DropdownMenuItem
                                onClick={() =>
                                    setTheme(theme === "light" ? "dark" : "light")
                                }
                                className="cursor-pointer"
                            >
                                <Sun className="mr-2 size-4 dark:hidden" />
                                <Moon className="mr-2 hidden size-4 dark:block" />
                                {theme === "light" ? "Modo oscuro" : "Modo claro"}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                            <LogOut className="mr-2 size-4" />
                            Cerrar sesion
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-xs">
                            v{packageJson.version}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
