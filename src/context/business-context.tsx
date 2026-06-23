"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  startTransition,
  ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Business } from "@/lib/types/business";
import { businessRoutes } from "@/lib/routes/business";
import apiClient from "@/lib/axios";
import { useRouter, usePathname } from "next/navigation";
import { sileo } from "sileo";
import { clearAuthCookies } from "@/lib/cookies";

type BusinessContextType = {
  businesses: Business[];
  /** Negocios archivados por un downgrade de plan (solo lectura, recuperables con Pro). */
  archivedBusinesses: Business[];
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
  isLoading: boolean;
};

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Inicialización perezosa desde sessionStorage (en cliente): evita el patrón
  // de setState dentro de un efecto de montaje. En SSR no hay `window`, así que
  // arrancan en null; durante hidratación la lista de negocios aún no resolvió
  // (isLoading), por lo que estos valores no afectan el HTML inicial.
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem("activeBusinessId"),
  );
  const [loginMode] = useState<string | null>(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem("loginMode"),
  );

  // 🔥 Traer negocios del usuario
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data } = await apiClient.get(businessRoutes.getMyBusinesses);

      if (Array.isArray(data?.data)) {
        return data.data;
      }
      return [];
    },
    retry: (failureCount, error: unknown) => {
      if (error instanceof Error && "response" in error && (error as { response?: { status?: number } }).response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  const scopedBusinesses: Business[] = useMemo(() => {
    const all: Business[] = Array.isArray(data) ? data : [];
    /* Cuando se entra como trabajador, my-business también trae los negocios
       propios; el selector solo debe mostrar aquellos donde es trabajador. */
    if (loginMode === "worker") {
      return all.filter((b) => b.isWorker === true);
    }
    return all;
  }, [data, loginMode]);

  /* Los negocios archivados (downgrade de plan) no son operables: se separan
     para mostrarlos bloqueados en el selector, pero nunca como activos. */
  const businesses: Business[] = useMemo(
    () => scopedBusinesses.filter((b) => b.status !== "archived"),
    [scopedBusinesses],
  );

  const archivedBusinesses: Business[] = useMemo(
    () => scopedBusinesses.filter((b) => b.status === "archived"),
    [scopedBusinesses],
  );

  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      console.error("BusinessProvider error:", error);

      if (isAxiosError(error) && error.response?.status === 401) {
        sileo.error({
          title: "Sesión expirada",
          description: "Tu sesión ha expirado. Inicia sesión nuevamente.",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        });
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("activeBusinessId");
        clearAuthCookies();
        router.push("/login");
      } else {
        sileo.error({
          title: "Error al cargar negocios",
          description: isAxiosError(error)
            ? error.response?.data?.message ?? "Error de conexión con el servidor"
            : "Error inesperado. Intenta recargar la página.",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        });
      }
      return;
    }

    if (pathname === "/dashboard/business/create") return;

    if (!businesses.length) {
      router.push("/dashboard/business/create");
      return;
    }

    const exists = businesses.find((b) => b.id === activeBusinessId);

    if (!exists) {
      startTransition(() => setActiveBusinessId(businesses[0].id));
    }
  }, [businesses, activeBusinessId, isLoading, isError, error, pathname, router]);

  // 🔹 Persistir
  useEffect(() => {
    if (activeBusinessId) {
      sessionStorage.setItem("activeBusinessId", activeBusinessId);
    }
  }, [activeBusinessId]);

  // 🔥 Obtener objeto completo del negocio activo
  const activeBusiness = useMemo(() => {
    return businesses.find((b) => b.id === activeBusinessId) || null;
  }, [businesses, activeBusinessId]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        archivedBusinesses,
        activeBusinessId,
        activeBusiness,
        setActiveBusinessId,
        isLoading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusiness must be used inside BusinessProvider");
  }
  return context;
}
