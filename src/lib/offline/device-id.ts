import { randomUuid } from "./uuid";

const DEVICE_ID_KEY = "negora-device-id";

/**
 * Identificador estable de este dispositivo (plan offline, A1.2).
 *
 * Viaja como cabecera `X-Device-Id` y el backend lo guarda con cada operación
 * sincronizada. No identifica a la persona ni sirve para autenticar: es para
 * poder responder a "esta venta duplicada, ¿de qué tablet salió?" cuando un
 * negocio tiene tres mostradores.
 *
 * Va en `localStorage` y no en `sessionStorage` a propósito: debe sobrevivir al
 * cierre de sesión y a cerrar el navegador, porque el dispositivo sigue siendo
 * el mismo.
 */
export function getDeviceId(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const id = randomUuid();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // Modo privado o almacenamiento bloqueado: se sincroniza igual, solo que
    // sin poder decir de qué dispositivo salió cada operación.
    return null;
  }
}
