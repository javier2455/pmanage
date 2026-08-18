"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

const min = 60 * 1000;
const hour = 60 * min;

/**
 * Se exporta para poder probar el comportamiento sin conexión: `networkMode`
 * decide si la aplicación puede trabajar sin red, y es un ajuste que no se ve
 * en ninguna pantalla hasta que falla.
 */
export function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // Al volver la red, lo que hay en pantalla puede venir de la copia
        // local: se refresca aunque React Query lo considere fresco, porque
        // "fresco" mide cuándo se sirvió, no de dónde salió.
        refetchOnReconnect: "always",
        staleTime: 5 * min,
        // SIN ESTO NO HAY MODO SIN CONEXIÓN. Por defecto React Query PAUSA
        // toda consulta cuando `navigator.onLine` es falso: no llega a llamar
        // a la función de la consulta, así que el respaldo en la base local
        // (`withOfflineFallback`) nunca se ejecuta. La pantalla no da error
        // —la consulta queda "en pausa", no fallida—, simplemente se queda
        // con la lista vacía: sin ventas y sin catálogo, como si el negocio
        // no tuviera nada.
        //
        // `offlineFirst` lanza SIEMPRE el primer intento y solo pausa los
        // reintentos si falla estando sin red. Es justo lo que hace falta
        // cuando hay otra capa de caché debajo —aquí, IndexedDB—.
        networkMode: "offlineFirst",
      },
      mutations: {
        // Lo mismo, y aquí se ve peor: una venta lanzada sin conexión se
        // quedaba en pausa con el botón «Registrando…» girando para siempre,
        // porque `createSaleOrQueue` —que la habría guardado en la cola— no
        // llegaba a ejecutarse nunca.
        networkMode: "offlineFirst",
      },
    },
  });

  // Catálogo estático — cambia muy raramente
  queryClient.setQueryDefaults(["all-provinces"], { staleTime: 24 * hour, gcTime: Infinity });
  queryClient.setQueryDefaults(["all-municipalities-by-province-id"], { staleTime: 24 * hour, gcTime: Infinity });
  queryClient.setQueryDefaults(["all-plans"], { staleTime: 24 * hour, gcTime: Infinity });
  queryClient.setQueryDefaults(["menu-list-flat"], { staleTime: 24 * hour, gcTime: Infinity });

  // Sesión / perfil — cambia raramente
  queryClient.setQueryDefaults(["businesses"], { staleTime: 30 * min, gcTime: hour });
  queryClient.setQueryDefaults(["auth-user-data"], { staleTime: 30 * min, gcTime: hour });
  queryClient.setQueryDefaults(["all-workers-by-business-id"], { staleTime: 30 * min, gcTime: hour });
  queryClient.setQueryDefaults(["business-worker"], { staleTime: 30 * min, gcTime: hour });
  queryClient.setQueryDefaults(["all-invitations-by-business-id"], { staleTime: 30 * min, gcTime: hour });
  queryClient.setQueryDefaults(["invitations-count"], { staleTime: 30 * min, gcTime: hour });

  // Productos / tipo de cambio — frecuencia moderada
  queryClient.setQueryDefaults(["all-products"], { staleTime: 10 * min, gcTime: 30 * min });
  queryClient.setQueryDefaults(["all-product-of-my-businesses"], { staleTime: 10 * min, gcTime: 30 * min });
  queryClient.setQueryDefaults(["product"], { staleTime: 10 * min, gcTime: 30 * min });
  queryClient.setQueryDefaults(["exchange-rate"], { staleTime: 10 * min, gcTime: 30 * min });

  // Transaccional — cambia con cada operación
  queryClient.setQueryDefaults(["all-sales-by-business-id"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["sale-by-id"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["current-inventory-by-business-id"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["inventory-history-by-business-id"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["dashboard-summary"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["all-expenses"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["expense"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["daily-accounting-close"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["monthly-accounting-close"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["analytics-kpis"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["analytics-sales-trend"], { staleTime: 30 * 1000, gcTime: 5 * min });
  queryClient.setQueryDefaults(["analytics-top-products"], { staleTime: 30 * 1000, gcTime: 5 * min });

  return queryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
