"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  type ConnectivityStatus,
  isReachable,
  nextProbeDelay,
  resolveStatus,
} from "@/lib/connectivity";
import { probeConnectivity } from "@/lib/api/sync";

export interface ConnectivityState {
  status: ConnectivityStatus;
  isOnline: boolean;
  isOffline: boolean;
  /** Momento del último sondeo con respuesta; null si aún no hubo ninguno. */
  lastOnlineAt: Date | null;
  /** Fuerza un sondeo inmediato (p. ej. al pulsar "Reintentar"). */
  checkNow: () => void;
}

/**
 * Estado de conexión real de la aplicación (plan offline, B0).
 *
 * Combina tres señales: los eventos `online`/`offline` del navegador, la
 * visibilidad de la pestaña y un sondeo periódico al servidor. La decisión vive
 * en `@/lib/connectivity` (lógica pura y probada); aquí solo se orquestan los
 * efectos.
 *
 * La razón de no fiarse de `navigator.onLine` a secas está en ese módulo: solo
 * ve el enlace de red, no la salida a Internet.
 */
/** El enlace de red del navegador, leído como store externo. */
function subscribeToBrowserLink(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
const getBrowserLink = () => navigator.onLine;
// En el build estático no hay navegador: se asume enlace para que el primer
// render no pinte un aviso de "sin conexión" que aún no se sabe si es cierto.
const getBrowserLinkOnServer = () => true;

export function useConnectivity(): ConnectivityState {
  const browserOnline = useSyncExternalStore(
    subscribeToBrowserLink,
    getBrowserLink,
    getBrowserLinkOnServer,
  );
  const [lastProbeReachable, setLastProbeReachable] = useState<boolean | null>(
    null,
  );
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);

  const failuresRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Evita que un sondeo en vuelo escriba estado tras desmontar el componente.
  const mountedRef = useRef(true);

  const status = resolveStatus({ browserOnline, lastProbeReachable });

  const runProbe = useCallback(async () => {
    // Sin enlace de red el sondeo está condenado a fallar: se ahorra la
    // petición y se deja el contador de fallos intacto para que, al volver el
    // enlace, se reintente enseguida y no con el retroceso máximo.
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const outcome = await probeConnectivity(controller.signal);
    if (!mountedRef.current || controller.signal.aborted) return;

    const reachable = isReachable(outcome);
    failuresRef.current = reachable ? 0 : failuresRef.current + 1;
    setLastProbeReachable(reachable);
    if (reachable) setLastOnlineAt(new Date());
  }, []);

  // Sondeo inicial y al volver la pestaña a primer plano.
  useEffect(() => {
    mountedRef.current = true;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void runProbe();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    // `runProbe` sí actualiza estado, pero solo DESPUÉS de esperar la
    // respuesta de red: no hay render en cascada al montar. La regla no puede
    // ver a través del `await` y marca cualquier llamada transitiva a setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runProbe();

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [runProbe]);

  // Recuperar el enlace de red NO prueba que haya Internet (portal cautivo,
  // ISP caído): se confirma con un sondeo antes de darse por conectado.
  useEffect(() => {
    // Mismo motivo que arriba: el estado se toca tras la respuesta de red.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (browserOnline) void runProbe();
  }, [browserOnline, runProbe]);

  // Programa el siguiente sondeo según el estado actual.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const delay = nextProbeDelay({
      status,
      consecutiveFailures: failuresRef.current,
      documentVisible:
        typeof document === "undefined" || document.visibilityState === "visible",
    });
    if (delay === null) return;

    timerRef.current = setTimeout(() => void runProbe(), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, lastProbeReachable, runProbe]);

  const checkNow = useCallback(() => {
    failuresRef.current = 0;
    void runProbe();
  }, [runProbe]);

  return {
    status,
    isOnline: status === "online",
    isOffline: status === "offline",
    lastOnlineAt,
    checkNow,
  };
}
