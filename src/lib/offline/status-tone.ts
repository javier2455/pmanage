/**
 * Qué anuncia el icono de estado cuando pasan varias cosas a la vez.
 *
 * Un solo icono para conexión, cambios sin subir y datos guardados obliga a
 * decidir cuál gana. El orden no es estético: manda lo que cambia lo que la
 * persona puede hacer AHORA.
 */
export type OfflineStatusTone =
  | "offline"
  | "rejected"
  | "pending"
  | "preparing"
  | "incomplete"
  | "ready";

export interface StatusToneInput {
  isOffline: boolean;
  /** Operaciones que el servidor rechazó y esperan una decisión. */
  rejected: number;
  /** Todo lo que aún no está en el servidor. */
  unsynced: number;
  isPreparing: boolean;
  /** Datos que no se pudieron guardar para trabajar sin conexión. */
  failedResources: number;
}

export function resolveStatusTone(input: StatusToneInput): OfflineStatusTone {
  // Sin conexión va primero porque cambia lo que se puede hacer: cobrar deja de
  // ser posible y toda venta se queda en el dispositivo. Es el dato que hay que
  // ver sin abrir nada.
  if (input.isOffline) return "offline";

  // Un rechazo pide una decisión de una persona; lo pendiente se resuelve solo
  // en cuanto se pulse subir. Lo que necesita a alguien va delante.
  if (input.rejected > 0) return "rejected";
  if (input.unsynced > 0) return "pending";

  // La preparación no bloquea nada: se está trabajando con conexión y los datos
  // llegan del servidor igual.
  if (input.isPreparing) return "preparing";
  if (input.failedResources > 0) return "incomplete";

  return "ready";
}
