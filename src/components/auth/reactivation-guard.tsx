"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUserData } from "@/hooks/use-auth";
import { setDeactivatedCookie } from "@/lib/cookies";

/**
 * Fuente fresca de verdad para el estado de desactivación. El middleware hace
 * el bloqueo rápido (cookie, sin parpadeo), pero la cookie puede quedar
 * obsoleta. Este guard consulta `/auth/me` y:
 *  - si el usuario está desactivado, siembra la cookie y lo envía a la pantalla
 *    de reactivación;
 *  - si no lo está, limpia una cookie obsoleta para no bloquearlo por error.
 */
export function ReactivationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data } = useAuthUserData();

  useEffect(() => {
    if (!data) return;
    if (data.deactivatedAt) {
      setDeactivatedCookie(data.deactivatedAt);
      router.replace("/cuenta-desactivada");
    } else {
      setDeactivatedCookie(null);
    }
  }, [data, router]);

  return <>{children}</>;
}
