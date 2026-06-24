"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { isProRoute, getProRedirect } from "@/lib/pro-gates";

const ADMIN_PREFIX = "/dashboard/admin";

/**
 * Barrera de cliente para rutas Pro y admin ante navegación directa por URL.
 *
 * El middleware ya hace este gateo, pero está inerte en el build estático
 * (`output: "export"` en `next.config.ts`): no se ejecuta. Por eso este guard es
 * la protección real en producción para:
 *  - rutas Pro (analytics, equipo, proveedores, cierre mensual) → solo plan Pro;
 *  - `/dashboard/admin/*` → solo rol admin.
 *
 * El sidebar solo oculta/pinta el badge; esta es la barrera real. El backend
 * sigue siendo la autoridad (responde 403); esto es UX para no mostrar páginas
 * inoperables.
 *
 * Solo redirige cuando el plan/rol ya está resuelto (no vacío), para no expulsar
 * al usuario durante la hidratación antes de leer la sesión.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isProPlan, isAdmin, roleName, planType } = useUserRoleAndPlan();

  const redirectTarget = useMemo<string | null>(() => {
    // Plan ya resuelto y no es Pro: bloquear rutas Pro.
    if (planType && !isProPlan && isProRoute(pathname)) {
      return getProRedirect(pathname) ?? "/dashboard";
    }
    // Rol ya resuelto y no es admin: bloquear el panel de administración.
    if (roleName && !isAdmin && pathname.startsWith(ADMIN_PREFIX)) {
      return "/dashboard";
    }
    return null;
  }, [planType, isProPlan, roleName, isAdmin, pathname]);

  useEffect(() => {
    if (redirectTarget && redirectTarget !== pathname) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, pathname, router]);

  if (redirectTarget) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
