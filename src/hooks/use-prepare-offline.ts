"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBusiness } from "@/context/business-context";
import { useAllowedNavigation } from "@/hooks/use-allowed-navigation";
import { isPathAllowed } from "@/components/auth/access-guard";
import { businessProductsQueryOptions } from "@/hooks/use-business";
import { exchangeRateQueryOptions } from "@/hooks/use-exchange";
import { DEFAULT_SALES_LIMIT, salesQueryOptions } from "@/hooks/use-sales";

/**
 * Deja el dispositivo listo para trabajar sin conexión (plan offline, B4).
 *
 * Hasta ahora cada pantalla guardaba su copia la primera vez que cargaba bien,
 * lo que obliga a haber pasado por ella con red. Eso funciona para quien usa la
 * aplicación a diario, pero deja fuera el caso que importa: abrir la app por la
 * mañana con señal, quedarse en el panel, y perder la conexión antes de entrar
 * a vender. Sin catálogo no hay venta.
 *
 * Tres decisiones que lo mantienen honesto:
 *
 * 1. **Solo lo imprescindible para vender**, no la aplicación entera. Son unos
 *    cientos de KB, no los megas del precacheado del código.
 * 2. **Pieza a pieza, sin todo-o-nada.** Media descarga de datos SÍ sirve: con
 *    catálogo y tasas ya se puede vender aunque falten las últimas ventas. Es
 *    justo lo contrario que el código de la aplicación, donde media copia está
 *    rota.
 * 3. **Solo lo que esa persona puede ver.** A quien no tiene acceso a ventas no
 *    se le descarga el catálogo.
 */

export type ResourceStatus = "pending" | "loading" | "ready" | "failed";

export interface PreparedResource {
  id: string;
  label: string;
  status: ResourceStatus;
}

export interface OfflineReadiness {
  /** Hay una descarga en curso. */
  isPreparing: boolean;
  /** Todo lo necesario está guardado en el dispositivo. */
  isReady: boolean;
  resources: PreparedResource[];
  failedCount: number;
  /** Vuelve a intentar lo que falta. */
  retry: () => void;
}

interface ResourceSpec {
  id: string;
  label: string;
  /** Ruta que implica necesitar este dato; null = siempre hace falta. */
  requiredUrl: string | null;
  options: (businessId: string) => {
    queryKey: unknown[];
    queryFn: () => Promise<unknown>;
  };
}

const SALES_URL = "/dashboard/business/sales";

const RESOURCES: ResourceSpec[] = [
  {
    id: "products",
    label: "Catálogo de productos",
    requiredUrl: SALES_URL,
    options: businessProductsQueryOptions,
  },
  {
    // Sin tasas no se puede cobrar en divisa, así que hace falta siempre que se
    // maneje dinero — que es en cualquier pantalla operativa.
    id: "rates",
    label: "Tasas de cambio",
    requiredUrl: null,
    options: exchangeRateQueryOptions,
  },
  {
    id: "sales",
    label: "Últimas ventas",
    requiredUrl: SALES_URL,
    options: (businessId) =>
      salesQueryOptions(businessId, { page: 1, limit: DEFAULT_SALES_LIMIT }),
  },
];

/**
 * Se considera reciente lo descargado hace menos de esto y no se vuelve a
 * pedir. Cambiar de pantalla no debe disparar la preparación otra vez.
 */
const FRESH_MS = 5 * 60 * 1000;

/**
 * Qué hay que descargar para esta persona.
 *
 * Se extrae del hook para poder probarlo: equivocarse aquí no da un error, da
 * algo peor — o se descarga a un trabajador datos que no le corresponden, o se
 * le deja sin lo que necesita y no se entera hasta quedarse sin conexión.
 */
export function neededResources(
  specs: ResourceSpec[],
  access: { enforce: boolean; allowedUrls: string[] },
): ResourceSpec[] {
  return specs.filter(
    (resource) =>
      // El control por secciones solo aplica a trabajadores; para el dueño el
      // árbol ya representa todo lo suyo.
      !access.enforce ||
      resource.requiredUrl === null ||
      isPathAllowed(resource.requiredUrl, access.allowedUrls),
  );
}

/** Los recursos reales, expuestos para las pruebas. */
export const OFFLINE_RESOURCES = RESOURCES;

export function usePrepareOffline(): OfflineReadiness {
  const queryClient = useQueryClient();
  const { activeBusinessId } = useBusiness();
  const { allowedUrls, enforce, isResolved } = useAllowedNavigation();

  const [statuses, setStatuses] = useState<Record<string, ResourceStatus>>({});
  const [isPreparing, setIsPreparing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const runningRef = useRef(false);

  const needed = useMemo(
    () => neededResources(RESOURCES, { enforce, allowedUrls }),
    [enforce, allowedUrls],
  );

  const run = useCallback(async () => {
    if (runningRef.current || !activeBusinessId) return;
    // Sin enlace de red la descarga está condenada a fallar; se ahorra el
    // intento y con él tres errores en consola y un aviso que no aporta nada.
    if (typeof navigator !== "undefined" && navigator.onLine === false) return;

    runningRef.current = true;
    setIsPreparing(true);
    try {
      for (const resource of needed) {
        setStatuses((prev) => ({ ...prev, [resource.id]: "loading" }));
        try {
          // Secuencial y no en paralelo: sobre una conexión lenta compiten
          // entre ellas, y además así el indicador puede decir qué se está
          // descargando ahora mismo en vez de un "cargando" sin contenido.
          await queryClient.fetchQuery({
            ...resource.options(activeBusinessId),
            staleTime: FRESH_MS,
          });
          setStatuses((prev) => ({ ...prev, [resource.id]: "ready" }));
        } catch {
          // Una pieza que falla no detiene a las demás: las que sí lleguen
          // siguen sirviendo sin conexión.
          setStatuses((prev) => ({ ...prev, [resource.id]: "failed" }));
        }
      }
    } finally {
      runningRef.current = false;
      setIsPreparing(false);
    }
  }, [activeBusinessId, needed, queryClient]);

  useEffect(() => {
    if (!activeBusinessId || !isResolved) return;
    // `run` solo toca el estado DESPUÉS de esperar a la red: no hay render en
    // cascada al montar.
    void run();
  }, [activeBusinessId, isResolved, run, attempt]);

  // Al recuperar el enlace de red se reintenta lo que faltó. Se escucha el
  // evento del navegador en vez de sondear: aquí no hace falta precisión, solo
  // no quedarse esperando indefinidamente a que alguien recargue.
  useEffect(() => {
    const onOnline = () => void run();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [run]);

  const resources = useMemo(
    () =>
      needed.map((resource) => ({
        id: resource.id,
        label: resource.label,
        status: statuses[resource.id] ?? "pending",
      })),
    [needed, statuses],
  );

  return {
    isPreparing,
    isReady:
      resources.length > 0 && resources.every((r) => r.status === "ready"),
    resources,
    failedCount: resources.filter((r) => r.status === "failed").length,
    retry: () => setAttempt((value) => value + 1),
  };
}
