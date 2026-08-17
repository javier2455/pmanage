import { defineSuite, expect } from "../harness";
import {
  ONLINE_HEARTBEAT_MS,
  OFFLINE_RETRY_MAX_MS,
  OFFLINE_RETRY_MIN_MS,
  isReachable,
  nextProbeDelay,
  offlineRetryDelay,
  resolveStatus,
} from "@/lib/connectivity";

export const connectivitySuite = defineSuite(
  "Conectividad (offline)",
  ({ test }) => {
    /* ----------------------------------------------------- alcanzabilidad */

    test(
      "una respuesta 200 demuestra que hay conexión",
      () => {
        expect(isReachable({ status: 200 })).toBe(true);
      },
      "El caso normal: el servidor contestó.",
    );

    test(
      "un 404 o un 500 TAMBIÉN demuestran conexión",
      () => {
        expect(isReachable({ status: 404 })).toBe(true);
        expect(isReachable({ status: 500 })).toBe(true);
        expect(isReachable({ status: 401 })).toBe(true);
      },
      "Si el servidor respondió algo, la red funciona. Tratar un 404 como " +
        "'sin conexión' dejaría la app encolando ventas que podía subir, y " +
        "además permite que el detector funcione aunque el endpoint de sondeo " +
        "aún no esté desplegado.",
    );

    test(
      "solo un fallo de red significa sin conexión",
      () => {
        expect(isReachable({ networkError: true })).toBe(false);
        expect(isReachable({})).toBe(false);
      },
      "Sin respuesta (DNS, conexión rechazada, timeout) no hay salida a Internet.",
    );

    /* ------------------------------------------------------------ estado */

    test(
      "sin enlace de red el estado es sin conexión",
      () => {
        expect(
          resolveStatus({ browserOnline: false, lastProbeReachable: true }),
        ).toBe("offline");
      },
      "El navegador dice que no hay ni WiFi ni datos: no hace falta sondear.",
    );

    test(
      "con enlace pero sondeo fallido, sin conexión (WiFi sin salida)",
      () => {
        expect(
          resolveStatus({ browserOnline: true, lastProbeReachable: false }),
        ).toBe("offline");
      },
      "El caso que `navigator.onLine` no detecta y que motiva todo el módulo: " +
        "portal cautivo, WiFi sin Internet o ISP caído.",
    );

    test(
      "con enlace y sondeo correcto, en línea",
      () => {
        expect(
          resolveStatus({ browserOnline: true, lastProbeReachable: true }),
        ).toBe("online");
      },
    );

    test(
      "al arrancar, sin ningún sondeo todavía, se asume en línea",
      () => {
        expect(
          resolveStatus({ browserOnline: true, lastProbeReachable: null }),
        ).toBe("online");
      },
      "Optimista a propósito: bloquear la interfaz mientras llega el primer " +
        "sondeo haría parecer que la app está rota en cada arranque.",
    );

    /* --------------------------------------------------------- retroceso */

    test(
      "el retroceso duplica el intervalo en cada fallo",
      () => {
        expect(offlineRetryDelay(1)).toBe(OFFLINE_RETRY_MIN_MS);
        expect(offlineRetryDelay(2)).toBe(OFFLINE_RETRY_MIN_MS * 2);
        expect(offlineRetryDelay(3)).toBe(OFFLINE_RETRY_MIN_MS * 4);
      },
      "5s, 10s, 20s… para no gastar batería ni datos móviles sondeando en vano.",
    );

    test(
      "el retroceso tiene tope",
      () => {
        expect(offlineRetryDelay(20)).toBe(OFFLINE_RETRY_MAX_MS);
      },
      "Tras un rato sin conexión se sigue comprobando cada minuto: hay que " +
        "detectar la vuelta de la red sin castigar el dispositivo.",
    );

    /* ------------------------------------------------- próximo sondeo */

    test(
      "con la pestaña oculta no se programa ningún sondeo",
      () => {
        expect(
          nextProbeDelay({
            status: "offline",
            consecutiveFailures: 1,
            documentVisible: false,
          }),
        ).toBeNull();
      },
      "En segundo plano no hay a quién avisar; al volver a primer plano el " +
        "hook sondea de inmediato.",
    );

    test(
      "sin conexión, el siguiente sondeo sigue el retroceso",
      () => {
        expect(
          nextProbeDelay({
            status: "offline",
            consecutiveFailures: 3,
            documentVisible: true,
          }),
        ).toBe(OFFLINE_RETRY_MIN_MS * 4);
      },
    );

    test(
      "en línea, el sondeo es un latido regular",
      () => {
        expect(
          nextProbeDelay({
            status: "online",
            consecutiveFailures: 0,
            documentVisible: true,
          }),
        ).toBe(ONLINE_HEARTBEAT_MS);
      },
      "Permite avisar de la caída ANTES de que el cajero intente cobrar.",
    );
  },
  {
    description:
      "Decide si hay conexión real. `navigator.onLine` solo ve el enlace de " +
      "red, no la salida a Internet.",
  },
);
