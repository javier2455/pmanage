"use client";

import { useState, useEffect } from "react";
import packageJson from "../../../package.json";
import { ChevronsUpDown, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import { PlanIndicator } from "@/components/sidebar/plan-indicator";

interface StoredUser {
  name?: string;
  email?: string;
  avatar?: string | null;
}

export function NavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { setTheme, resolvedTheme } = useTheme();
  const [user, setUser] = useState<StoredUser>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) return;
    try {
      const parsed: StoredUser = JSON.parse(stored);
      queueMicrotask(() => setUser(parsed));
    } catch {
      sessionStorage.removeItem("user");
    }
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const userName = user.name ?? "";
  const userEmail = user.email ?? "";
  const userAvatar = user.avatar ?? "";

  async function handleLogout() {
    await clearSession();
    router.push("/login");
  }

  return (
    <>
      <PlanIndicator />

      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {userAvatar ? (
                    <AvatarImage
                      src={userAvatar}
                      alt={userName}
                      className="rounded-lg"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                    {userName
                      .split(" ")
                      .map((n) => n[0])
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
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push("/dashboard/profile")}
                >
                  <User className="mr-2 size-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                >
                  {isDark ? (
                    <Sun className="mr-2 size-4" />
                  ) : (
                    <Moon className="mr-2 size-4" />
                  )}
                  {isDark ? "Modo claro" : "Modo oscuro"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 size-4" />
                Cerrar sesion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                v{packageJson.version}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
