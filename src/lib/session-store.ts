/**
 * Almacenamiento de la sesión del usuario.
 *
 * **`localStorage`, no `sessionStorage`**, y la diferencia es todo el modo sin
 * conexión. `sessionStorage` muere al cerrar la pestaña o la aplicación, así
 * que quien cerraba la app sin red se quedaba fuera: volver a entrar exige al
 * servidor de autenticación, y sin conexión no hay servidor. Sus ventas
 * encoladas seguían en el dispositivo, pero la pantalla que las muestra estaba
 * detrás del login. La promesa «no se pierde una venta» quedaba en «no se
 * pierde mientras no cierres la app», que en un móvil —donde el sistema mata
 * procesos en segundo plano— no aguanta una jornada.
 *
 * Lo que esto cuesta, dicho claro: el token de refresco queda escrito en el
 * dispositivo. Un teléfono perdido es una sesión abierta hasta que ese token
 * caduque. Es un intercambio deliberado, y lo que lo compensa es el bloqueo del
 * propio dispositivo (y, cuando se decida, un PIN para entrar sin conexión).
 *
 * Efecto secundario buscado: las pestañas dejan de tener sesiones
 * independientes y comparten una sola, que es lo que la gente espera de una
 * aplicación.
 */

/** Claves que forman la sesión. El tour usa su propio almacén, por pestaña. */
export const SESSION_KEYS = [
  "token",
  "refresh_token",
  "user",
  "activeBusinessId",
  "loginMode",
] as const;

export type SessionKey = (typeof SESSION_KEYS)[number];

let migrated = false;

/**
 * Rescata una sesión abierta con la versión anterior.
 *
 * Sin esto, el despliegue que introduce este cambio echaría fuera a todo el que
 * tuviera la aplicación abierta, sin más motivo que haber movido dónde se
 * guarda. Se hace una sola vez y de forma perezosa.
 */
function migrateLegacySession(): void {
  if (migrated) return;
  migrated = true;
  if (typeof window === "undefined") return;

  try {
    for (const key of SESSION_KEYS) {
      if (localStorage.getItem(key) !== null) continue;
      const legacy = sessionStorage.getItem(key);
      if (legacy !== null) localStorage.setItem(key, legacy);
    }
  } catch {
    // Almacenamiento bloqueado: se sigue sin migrar.
  }
}

export const sessionStore = {
  getItem(key: SessionKey): string | null {
    if (typeof window === "undefined") return null;
    migrateLegacySession();
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: SessionKey, value: string): void {
    if (typeof window === "undefined") return;
    migrateLegacySession();
    try {
      localStorage.setItem(key, value);
    } catch {
      // Modo privado o sin cuota: la sesión durará lo que dure la pestaña.
    }
  },

  removeItem(key: SessionKey): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
      // Se limpia también el sitio antiguo: si quedara ahí, la migración
      // perezosa resucitaría la sesión que se acaba de cerrar.
      sessionStorage.removeItem(key);
    } catch {
      // Sin acceso al almacenamiento no hay nada que borrar.
    }
  },

  /** Borra la sesión completa. Se usa al cerrar sesión. */
  clear(): void {
    for (const key of SESSION_KEYS) this.removeItem(key);
  },
};
