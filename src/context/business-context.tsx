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
import axios from "axios";
import { Business } from "@/lib/types/business";
import { businessRoutes } from "@/lib/routes/business";
import { useRouter, usePathname } from "next/navigation";
import { sileo } from "sileo";

type BusinessContextType = {
  businesses: Business[];
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

  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(
    () =>
      typeof window !== "undefined"
        ? sessionStorage.getItem("activeBusinessId")
        : null
  );

  // 🔥 Traer negocios del usuario
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const { data } = await axios.get(businessRoutes.getMyBusinesses, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (Array.isArray(data?.data)) {
        return data.data;
      }
      return [];
    },
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  const businesses: Business[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  useEffect(() => {
    if (isLoading) return;

    if (isError) {
      console.error("BusinessProvider error:", error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        sileo.error({
          title: "Sesión expirada",
          description: "Tu sesión ha expirado. Inicia sesión nuevamente.",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        });
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("activeBusinessId");
        router.push("/login");
      } else {
        sileo.error({
          title: "Error al cargar negocios",
          description: axios.isAxiosError(error)
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

  if (isLoading || (isError && !axios.isAxiosError(error))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <BusinessContext.Provider
      value={{
        businesses,
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
