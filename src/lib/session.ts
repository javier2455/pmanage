import { clearAuthCookies } from "@/lib/cookies";
import { logout } from "@/lib/api/auth";
import { clearOfflineCache } from "@/lib/offline-cache";
import { clearReadCache } from "@/lib/offline-read-cache";
import { sessionStore } from "@/lib/session-store";

/**
 * Cierra la sesión: invalida el access token en el backend (best-effort) y
 * limpia el estado local (sessionStorage + cookies de auth). No redirige; el
 * llamador decide a dónde navegar después.
 *
 * El interceptor de `apiClient` adjunta el access token; el refresh_token va en
 * el body. Si la llamada al backend falla (red/token expirado) igual limpiamos
 * la sesión local.
 */
export async function clearSession(): Promise<void> {
  const refreshToken = sessionStore.getItem("refresh_token");
  try {
    if (refreshToken) {
      await logout(refreshToken);
    }
  } catch {
    // Ignorado a propósito: el cierre de sesión local debe ocurrir igual.
  }

  // Se borra la sesión ENTERA, no clave por clave: ahora sobrevive al cierre
  // de la aplicación, así que una clave olvidada aquí ya no desaparecería sola
  // al cerrar la pestaña — se quedaría en el dispositivo indefinidamente.
  sessionStore.clear();
  clearAuthCookies();
  // Ni el árbol de menús ni las lecturas guardadas pueden sobrevivir a un
  // cambio de cuenta en el mismo dispositivo: dependen del rol, de los
  // permisos y del negocio del usuario que cerró sesión.
  clearOfflineCache();
  void clearReadCache();
}
