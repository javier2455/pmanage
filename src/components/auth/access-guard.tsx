"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAllowedNavigation } from "@/hooks/use-allowed-navigation";

/**
 * Rutas que NO dependen de los permisos de secciones: utilidades que cualquier
 * usuario autenticado debe poder abrir (crear su negocio, su perfil, sus
 * notificaciones y la propia página de "sin accesos"). El resto del dashboard
 * se valida contra el árbol de secciones permitidas.
 */
const ALWAYS_ALLOWED = [
  "/dashboard/business/create",
  "/dashboard/profile",
  "/dashboard/notifications",
  "/dashboard/no-access",
];

/**
 * `base` concede acceso a `pathname` si es la misma ruta o una subruta. El
 * raíz `/dashboard` se trata como exacto: de lo contrario habilitaría todo el
 * subárbol y anularía el control de acceso.
 */
function grants(pathname: string, base: string): boolean {
  if (base === "/dashboard") return pathname === "/dashboard";
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isPathAllowed(pathname: string, allowedUrls: string[]): boolean {
  if (ALWAYS_ALLOWED.some((base) => grants(pathname, base))) return true;
  return allowedUrls.some((url) => grants(pathname, url));
}

/**
 * Bloquea el render de páginas del dashboard a las que un trabajador no tiene
 * acceso y lo redirige a su primera ruta permitida (o a "sin accesos"). El
 * sidebar solo oculta; este guard es la barrera real para navegación directa
 * por URL y para el aterrizaje post-login.
 */
export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { allowedUrls, enforce, isResolved } = useAllowedNavigation();

  const decision = useMemo<"pending" | "allow" | "deny">(() => {
    if (!isResolved) return "pending";
    if (!enforce) return "allow";
    return isPathAllowed(pathname, allowedUrls) ? "allow" : "deny";
  }, [isResolved, enforce, pathname, allowedUrls]);

  const redirectTarget = useMemo<string | null>(() => {
    if (decision !== "deny") return null;
    return allowedUrls.find(Boolean) ?? "/dashboard/no-access";
  }, [decision, allowedUrls]);

  useEffect(() => {
    if (redirectTarget && redirectTarget !== pathname) {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, pathname, router]);

  if (decision === "allow") return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
