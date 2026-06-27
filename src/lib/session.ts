import { clearAuthCookies } from "@/lib/cookies";
import { logout } from "@/lib/api/auth";

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
  const refreshToken = sessionStorage.getItem("refresh_token");
  try {
    if (refreshToken) {
      await logout(refreshToken);
    }
  } catch {
    // Ignorado a propósito: el cierre de sesión local debe ocurrir igual.
  }

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("activeBusinessId");
  clearAuthCookies();
}
