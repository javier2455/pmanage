import axios from "axios";
import { SyncRoutes } from "@/lib/routes/sync";
import type { ProbeOutcome } from "@/lib/connectivity";

/** Corta el sondeo si el servidor no responde en este tiempo. */
export const PROBE_TIMEOUT_MS = 8_000;

/**
 * Sondea el servidor para saber si hay conexión real.
 *
 * Usa `axios` directo y NO el cliente con interceptores de la app, a propósito:
 * el interceptor de respuesta redirige al login ante un 401 y lanza el refresco
 * de token. Un sondeo de conectividad no debe provocar nada de eso — solo
 * pregunta "¿contesta el servidor?", y un 401 ya responde que sí.
 *
 * Nunca lanza: devuelve el resultado para que `isReachable` lo interprete.
 */
export async function probeConnectivity(
  signal?: AbortSignal,
): Promise<ProbeOutcome> {
  try {
    const response = await axios.get(SyncRoutes.health(), {
      timeout: PROBE_TIMEOUT_MS,
      signal,
      // Cualquier código es una respuesta válida para el sondeo: lo que se
      // mide es si el servidor contesta, no si el endpoint existe.
      validateStatus: () => true,
    });
    return { status: response.status };
  } catch (error) {
    // Con `validateStatus` siempre-verdadero, llegar aquí significa que no
    // hubo respuesta: fallo de red, timeout o petición cancelada.
    if (axios.isAxiosError(error) && error.response) {
      return { status: error.response.status };
    }
    return { networkError: true };
  }
}
