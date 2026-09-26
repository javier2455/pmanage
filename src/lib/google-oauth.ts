/**
 * Login con Google mediante popup.
 *
 * El Gateway DveloxSoft devuelve los tokens llamando a
 * `window.opener.postMessage(...)` desde la ventana del OAuth, así que el flujo
 * tiene que abrirse en un popup y escuchar ese mensaje; no puede resolverse con
 * una navegación normal.
 *
 * Este módulo concentra las tres cosas que antes se hacían mal:
 *
 * 1. La URL se pide al backend (`/auth/google`), que es quien conoce el token
 *    de página del gateway. Antes el frontend llevaba ese JWT incrustado a
 *    mano: quedaba publicado en el bundle y caducaba en una hora, con lo que el
 *    login con Google se rompió en cuanto expiró.
 * 2. NO se escucha el evento `unload` del popup (ver `openGoogleAuthPopup`).
 * 3. El origen del `postMessage` se compara de forma EXACTA. Validarlo con
 *    `origin.includes("ms.dveloxsoft.com")` daba por bueno a cualquier
 *    `https://ms.dveloxsoft.com.dominio-atacante.com`.
 */

import { authRoutes } from "@/lib/routes/auth";

export interface GoogleAuthTokens {
  accessToken: string;
  refreshToken?: string;
}

/** Motivo por el que no se completó el login con Google. */
export type GoogleAuthFailure =
  | "popup-blocked"
  | "cancelled"
  | "timeout"
  | "gateway-error";

const FAILURE_MESSAGES: Record<GoogleAuthFailure, string> = {
  "popup-blocked":
    "No se pudo abrir la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.",
  cancelled: "Cerraste la ventana de Google antes de terminar.",
  timeout: "La ventana de Google tardó demasiado. Vuelve a intentarlo.",
  "gateway-error": "No se pudo iniciar sesión con Google.",
};

export class GoogleAuthError extends Error {
  readonly reason: GoogleAuthFailure;

  constructor(reason: GoogleAuthFailure, message?: string) {
    super(message?.trim() || FAILURE_MESSAGES[reason]);
    this.name = "GoogleAuthError";
    this.reason = reason;
  }
}

/** El usuario cerró la ventana: no es un fallo que merezca un error en rojo. */
export function isUserCancellation(error: unknown): boolean {
  return error instanceof GoogleAuthError && error.reason === "cancelled";
}

/**
 * Orígenes desde los que se acepta el `postMessage` con los tokens.
 *
 * El gateway vive en otro dominio, que cambia según el entorno (en local suele
 * ser un `localhost`), por eso es configurable. Admite lista separada por comas
 * en `NEXT_PUBLIC_GATEWAY_ORIGIN`.
 */
export function trustedGatewayOrigins(): string[] {
  const configured = process.env.NEXT_PUBLIC_GATEWAY_ORIGIN ?? "";
  const origins = configured
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        return new URL(entry).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  if (origins.length === 0) {
    origins.push("https://ms.dveloxsoft.com");
  }

  // El backend puede emitir el mensaje desde su propio origen.
  try {
    origins.push(new URL(authRoutes.google).origin);
  } catch {
    /* authRoutes.google mal formado: nos quedamos con los orígenes del gateway. */
  }

  if (typeof window !== "undefined") {
    origins.push(window.location.origin);
  }

  return [...new Set(origins)];
}

/**
 * URL del popup. Apunta SIEMPRE al backend, nunca al gateway directamente: el
 * backend es quien añade el token de página (secreto y con caducidad) y valida
 * el origen de retorno contra su allowlist.
 */
export function buildGoogleAuthUrl(): string {
  const url = new URL(authRoutes.google);
  // El gateway necesita saber a qué ventana `opener` devolver los tokens; sin
  // este dato responde 403 "Origen no especificado".
  url.searchParams.set("origin", window.location.origin);
  return url.toString();
}

/** Lee los tokens del mensaje admitiendo las dos convenciones de nombres. */
function readTokens(data: unknown): GoogleAuthTokens | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;

  const accessToken = payload.accessToken ?? payload.access_token;
  if (typeof accessToken !== "string" || !accessToken) return null;

  const refreshToken = payload.refreshToken ?? payload.refresh_token;
  return {
    accessToken,
    refreshToken: typeof refreshToken === "string" ? refreshToken : undefined,
  };
}

/** Mensaje de error que manda el gateway cuando el OAuth falla. */
function readGatewayError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as Record<string, unknown>;
  if (payload.type !== "GOOGLE_AUTH_ERROR") return null;
  return typeof payload.message === "string" ? payload.message : "";
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const CLOSE_POLL_MS = 400;
/** Margen para que un `postMessage` ya encolado gane a la detección de cierre. */
const CLOSE_GRACE_MS = 600;

interface OpenGoogleAuthPopupOptions {
  timeoutMs?: number;
}

/**
 * Abre el popup del OAuth y resuelve con los tokens.
 *
 * Debe invocarse DIRECTAMENTE desde el manejador del clic, sin ningún `await`
 * por delante: si `window.open` no ocurre dentro del gesto del usuario, el
 * navegador lo bloquea.
 */
export function openGoogleAuthPopup(
  options: OpenGoogleAuthPopupOptions = {},
): Promise<GoogleAuthTokens> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  let opened: Window | null = null;
  try {
    opened = window.open(
      buildGoogleAuthUrl(),
      "negora-google-auth",
      popupFeatures(),
    );
  } catch {
    opened = null;
  }

  if (!opened || opened.closed) {
    return Promise.reject(new GoogleAuthError("popup-blocked"));
  }

  const authWindow = opened;
  const trusted = trustedGatewayOrigins();

  return new Promise<GoogleAuthTokens>((resolve, reject) => {
    let settled = false;
    let closeGraceTimer: number | undefined;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(closedPoll);
      window.clearTimeout(timeoutTimer);
      if (closeGraceTimer !== undefined) window.clearTimeout(closeGraceTimer);
    };

    const settle = (action: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      action();
    };

    const succeed = (tokens: GoogleAuthTokens) =>
      settle(() => {
        if (!authWindow.closed) authWindow.close();
        resolve(tokens);
      });

    const fail = (error: GoogleAuthError, closeWindow = true) =>
      settle(() => {
        if (closeWindow && !authWindow.closed) authWindow.close();
        reject(error);
      });

    function onMessage(event: MessageEvent) {
      if (settled) return;
      // Comparación exacta: `includes` daba por válido cualquier dominio que
      // llevara el del gateway como subcadena.
      if (!trusted.includes(event.origin)) return;
      // El mensaje tiene que venir de la ventana que abrimos nosotros.
      if (event.source && event.source !== authWindow) return;

      const gatewayError = readGatewayError(event.data);
      if (gatewayError !== null) {
        fail(new GoogleAuthError("gateway-error", gatewayError));
        return;
      }

      const tokens = readTokens(event.data);
      if (tokens) succeed(tokens);
    }

    /*
     * Detección de cierre por sondeo.
     *
     * Aquí NO se escucha `unload` sobre el popup, que es justo lo que rompía el
     * login: `window.open` crea primero un documento `about:blank` del mismo
     * origen y lo descarga en cuanto navega al gateway. Ese `unload` se
     * disparaba de inmediato y el manejador cerraba la ventana recién abierta,
     * devolviendo al usuario al login sin haber llegado a ver Google.
     */
    const closedPoll = window.setInterval(() => {
      if (!authWindow.closed || settled || closeGraceTimer !== undefined) return;
      // El gateway hace `postMessage` y cierra acto seguido; se le da un margen
      // para que ese mensaje llegue antes de darlo por cancelado.
      closeGraceTimer = window.setTimeout(() => {
        fail(new GoogleAuthError("cancelled"), false);
      }, CLOSE_GRACE_MS);
    }, CLOSE_POLL_MS);

    const timeoutTimer = window.setTimeout(
      () => fail(new GoogleAuthError("timeout")),
      timeoutMs,
    );

    window.addEventListener("message", onMessage);
  });
}

/**
 * Geometría del popup. En móvil el navegador ignora estos valores y abre una
 * pestaña, que es el comportamiento esperado.
 */
function popupFeatures(): string {
  const width = 500;
  const height = 640;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  return `width=${width},height=${height},left=${left},top=${top},popup=yes,resizable=yes,scrollbars=yes`;
}
