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
// import axios from "@/lib/axios";
import axios from "axios";
import { Business } from "@/lib/types/business";
import { businessRoutes } from "@/lib/routes/business";

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
  // Inicializar desde localStorage durante el primer render (evita useEffect)
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem("activeBusinessId")
        : null
  );

  // 🔥 Traer negocios del usuario
  const { data, isLoading } = useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      
      const { data } = await axios.get(businessRoutes.getMyBusinesses, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (Array.isArray(data?.data)) {
        return data.data;
      }
      return [];
    },
  });

  const businesses: Business[] = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  // 🔹 Validar que el activo exista (startTransition evita render en cascada)
  useEffect(() => {
    if (!businesses.length) return;

    const exists = businesses.find((b) => b.id === activeBusinessId);

    if (!exists) {
      startTransition(() => setActiveBusinessId(businesses[0].id));
    }
  }, [businesses, activeBusinessId]);

  // 🔹 Persistir
  useEffect(() => {
    if (activeBusinessId) {
      localStorage.setItem("activeBusinessId", activeBusinessId);
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
