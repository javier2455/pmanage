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
  MIN_CHECK_FEEDBACK_MS,
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
  /** Hay un sondeo manual en curso. Solo lo activa `checkNow`. */
  isChecking: boolean;
  /**
   * Fuerza un sondeo inmediato (p. ej. al pulsar "Reintentar") y resuelve con
   * el resultado, para que quien llame pueda avisar de cómo fue.
   */
  checkNow: () => Promise<boolean>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const [isChecking, setIsChecking] = useState(false);

  const failuresRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Evita que un sondeo en vuelo escriba estado tras desmontar el componente.
  const mountedRef = useRef(true);

  const status = resolveStatus({ browserOnline, lastProbeReachable });

  const runProbe = useCallback(async (): Promise<boolean> => {
    // Sin enlace de red el sondeo está condenado a fallar: se ahorra la
    // petición y se deja el contador de fallos intacto para que, al volver el
    // enlace, se reintente enseguida y no con el retroceso máximo.
    if (typeof navigator !== "undefined" && !navigator.onLine) return false;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const outcome = await probeConnectivity(controller.signal);
    const reachable = isReachable(outcome);
    if (!mountedRef.current || controller.signal.aborted) return reachable;

    failuresRef.current = reachable ? 0 : failuresRef.current + 1;
    setLastProbeReachable(reachable);
    if (reachable) setLastOnlineAt(new Date());
    return reachable;
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

  const checkNow = useCallback(async (): Promise<boolean> => {
    // El reintento manual reinicia el retroceso: el usuario está diciendo
    // "creo que ya hay red", y merece una comprobación inmediata.
    failuresRef.current = 0;
    setIsChecking(true);
    const startedAt = Date.now();

    const reachable = await runProbe();

    // Sin red el sondeo falla al instante; se sostiene el indicador un momento
    // para que el reintento se perciba como una acción y no como un botón muerto.
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_CHECK_FEEDBACK_MS) {
      await wait(MIN_CHECK_FEEDBACK_MS - elapsed);
    }
    if (mountedRef.current) setIsChecking(false);
    return reachable;
  }, [runProbe]);

  return {
    status,
    isOnline: status === "online",
    isOffline: status === "offline",
    lastOnlineAt,
    isChecking,
    checkNow,
  };
}
