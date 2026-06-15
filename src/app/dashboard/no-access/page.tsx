"use client";

import { ShieldAlert, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clearAuthCookies } from "@/lib/cookies";
import { logout } from "@/lib/api/auth";

export default function NoAccessPage() {
  const router = useRouter();

  async function handleLogout() {
    const refreshToken = sessionStorage.getItem("refresh_token");
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // Best-effort: el cierre local debe ocurrir igual.
    }
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("activeBusinessId");
    clearAuthCookies();
    router.push("/login");
  }

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <CardTitle className="text-xl font-bold">Sin accesos</CardTitle>
            <CardDescription>
              Tu usuario no tiene permisos asignados en este negocio.
              Comunícate con el administrador para que habilite tus accesos.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
