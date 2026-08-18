import axios from "axios";
import apiClient from "@/lib/axios";
import { SyncRoutes } from "@/lib/routes/sync";
import type { ProbeOutcome } from "@/lib/connectivity";
import { getDeviceId } from "@/lib/offline/device-id";
import type { SyncPushResponse } from "@/lib/offline/outbox-policy";

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

/** Cabecera con la que el backend identifica el dispositivo de origen. */
export const DEVICE_ID_HEADER = "X-Device-Id";

/** Una operación tal como viaja en el lote. */
export interface SyncPushOperation {
  clientOperationId: string;
  seq: number;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
}

export interface SyncPushBody {
  businessId: string;
  batchId: string;
  clientSentAt: string;
  chunkIndex?: number;
  chunkTotal?: number;
  operations: SyncPushOperation[];
}

/**
 * Sube un lote de operaciones hechas sin conexión.
 *
 * Usa el cliente con interceptores a propósito: si el token caducó mientras el
 * dispositivo estaba sin red, el refresco automático deja subir el lote sin
 * molestar a la persona. Los errores se propagan tal cual; quien llama los
 * clasifica con `classifyPushFailure`.
 */
export async function pushOperations(
  body: SyncPushBody,
): Promise<SyncPushResponse> {
  const deviceId = getDeviceId();
  const { data } = await apiClient.post<SyncPushResponse>(
    SyncRoutes.push(),
    body,
    deviceId ? { headers: { [DEVICE_ID_HEADER]: deviceId } } : undefined,
  );
  return data;
}
