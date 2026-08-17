/**
 * Lógica pura de detección de conectividad (plan offline, B0).
 *
 * El punto de partida es que **`navigator.onLine` miente**: solo dice si hay
 * enlace de red (WiFi o datos conectados), no si se llega a Internet. Estar
 * conectado a un WiFi sin salida, detrás de un portal cautivo, o con el ISP
 * caído, son situaciones cotidianas aquí y en todas ellas `navigator.onLine`
 * vale `true` mientras la app no puede subir una sola venta.
 *
 * Por eso "en línea" exige DOS condiciones: que el navegador diga que hay
 * enlace **y** que un sondeo real haya obtenido respuesta del servidor.
 *
 * Este módulo no toca el DOM ni la red: decide. El hook que lo usa es quien
 * escucha eventos y dispara peticiones.
 */

export type ConnectivityStatus = "online" | "offline";

/** Cada cuánto se vuelve a sondear estando en línea, con la pestaña visible. */
export const ONLINE_HEARTBEAT_MS = 30_000;

/** Primer reintento tras caer, y tope al que llega el retroceso. */
export const OFFLINE_RETRY_MIN_MS = 5_000;
export const OFFLINE_RETRY_MAX_MS = 60_000;

/**
 * Duración mínima del estado "comprobando" en un reintento manual.
 *
 * Sin red, el sondeo falla en milisegundos: el indicador de carga parpadearía
 * tan rápido que el usuario no vería nada y volvería a pulsar creyendo que el
 * botón no funciona. Medio segundo basta para que la acción se perciba.
 */
export const MIN_CHECK_FEEDBACK_MS = 500;

/**
 * Resultado de un sondeo, expresado como lo ve quien lo lanzó.
 *
 * `status` es el código HTTP si el servidor respondió ALGO. `networkError`
 * marca que no hubo respuesta (DNS, conexión rechazada, timeout).
 */
export interface ProbeOutcome {
  status?: number;
  networkError?: boolean;
}

/**
 * ¿El sondeo demuestra que hay conexión?
 *
 * **Cualquier** respuesta HTTP la demuestra, incluido un 404 o un 500: si el
 * servidor contestó, la red funciona. Esto no es una tolerancia laxa, es la
 * pregunta correcta — y de paso hace que el detector funcione aunque el
 * endpoint de sondeo todavía no esté desplegado.
 *
 * Solo un fallo de red (sin respuesta) significa "sin conexión".
 */
export function isReachable(outcome: ProbeOutcome): boolean {
  if (outcome.networkError) return false;
  return typeof outcome.status === "number";
}

/**
 * Retroceso exponencial entre sondeos mientras no hay conexión: 5s, 10s, 20s,
 * 40s y a partir de ahí 60s.
 *
 * Sondear cada segundo gastaría batería y datos móviles —que aquí se pagan
 * caros— sin recuperar la conexión antes.
 */
export function offlineRetryDelay(consecutiveFailures: number): number {
  const exponent = Math.max(0, consecutiveFailures - 1);
  const delay = OFFLINE_RETRY_MIN_MS * 2 ** exponent;
  return Math.min(delay, OFFLINE_RETRY_MAX_MS);
}

export interface NextProbeInput {
  status: ConnectivityStatus;
  consecutiveFailures: number;
  /** Pestaña visible. En segundo plano no se sondea. */
  documentVisible: boolean;
}

/**
 * Cuándo toca el siguiente sondeo, o `null` para no programar ninguno.
 *
 * Con la pestaña oculta no se sondea: el usuario no está mirando y no hay nada
 * que avisarle. Al volver a primer plano, el hook sondea de inmediato en vez de
 * esperar al temporizador, que es lo que de verdad importa para el cajero que
 * desbloquea el móvil y quiere saber si ya puede subir la cola.
 */
export function nextProbeDelay(input: NextProbeInput): number | null {
  if (!input.documentVisible) return null;
  if (input.status === "offline") {
    return offlineRetryDelay(input.consecutiveFailures);
  }
  return ONLINE_HEARTBEAT_MS;
}

export interface ResolveStatusInput {
  /** Lo que dice `navigator.onLine`. */
  browserOnline: boolean;
  /** Último sondeo conocido; `null` si aún no se ha hecho ninguno. */
  lastProbeReachable: boolean | null;
}

/**
 * Estado resultante de combinar el enlace del navegador con el último sondeo.
 *
 * - Sin enlace → sin conexión, sin necesidad de sondear (ahorra la petición).
 * - Con enlace y sondeo fallido → sin conexión (el caso del WiFi sin salida).
 * - Con enlace y sin sondeo todavía → se asume en línea de forma optimista: es
 *   el arranque normal de la app, y bloquear la interfaz mientras llega el
 *   primer sondeo la haría parecer rota.
 */
export function resolveStatus(input: ResolveStatusInput): ConnectivityStatus {
  if (!input.browserOnline) return "offline";
  if (input.lastProbeReachable === false) return "offline";
  return "online";
}
