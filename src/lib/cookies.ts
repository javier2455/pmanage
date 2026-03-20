/**
 * Utilidades para cookies de autenticación.
 * Se sincronizan con sessionStorage para que el middleware pueda validar rutas.
 */

export const AUTH_COOKIE_NAMES = {
  token: "auth_token",
  role: "user_role",
  planType: "user_plan_type",
} as const;

const COOKIE_MAX_AGE_DAYS = 1;
const COOKIE_PATH = "/";

function buildCookieOptions(extra: { maxAge?: number } = {}) {
  const maxAge = (extra.maxAge ?? COOKIE_MAX_AGE_DAYS * 24 * 60 * 60).toString();
  const secure = typeof window !== "undefined" && window.location?.protocol === "https:";
  return `Path=${COOKIE_PATH}; Max-Age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/**
 * Guarda las cookies de autenticación (solo en el cliente).
 * Llamar tras login exitoso, junto con sessionStorage.
 */
export function setAuthCookies(params: {
  token?: string;
  role?: string;
  planType?: string;
}): void {
  if (typeof document === "undefined") return;

  const opts = buildCookieOptions();

  if (params.token) {
    document.cookie = `${AUTH_COOKIE_NAMES.token}=${encodeURIComponent(params.token)}; ${opts}`;
  }
  if (params.role) {
    document.cookie = `${AUTH_COOKIE_NAMES.role}=${encodeURIComponent(params.role)}; ${opts}`;
  }
  if (params.planType) {
    document.cookie = `${AUTH_COOKIE_NAMES.planType}=${encodeURIComponent(params.planType)}; ${opts}`;
  }
}

/**
 * Elimina todas las cookies de autenticación (solo en el cliente).
 * Llamar en logout y cuando expire la sesión.
 */
export function clearAuthCookies(): void {
  if (typeof document === "undefined") return;

  const past = "Max-Age=0";
  document.cookie = `${AUTH_COOKIE_NAMES.token}=; Path=${COOKIE_PATH}; ${past}`;
  document.cookie = `${AUTH_COOKIE_NAMES.role}=; Path=${COOKIE_PATH}; ${past}`;
  document.cookie = `${AUTH_COOKIE_NAMES.planType}=; Path=${COOKIE_PATH}; ${past}`;
}

/**
 * Lee las cookies de autenticación en el cliente.
 * Útil para componentes que necesiten el rol/plan sin leer sessionStorage.
 */
export function getAuthCookies(): {
  token: string | null;
  role: string | null;
  planType: string | null;
} {
  if (typeof document === "undefined") {
    return { token: null, role: null, planType: null };
  }

  const cookies = document.cookie.split(";").reduce<Record<string, string>>((acc, c) => {
    const [key, ...v] = c.trim().split("=");
    if (key && v.length) acc[key] = decodeURIComponent(v.join("=").trim());
    return acc;
  }, {});

  return {
    token: cookies[AUTH_COOKIE_NAMES.token] ?? null,
    role: cookies[AUTH_COOKIE_NAMES.role] ?? null,
    planType: cookies[AUTH_COOKIE_NAMES.planType] ?? null,
  };
}
