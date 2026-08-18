/**
 * A quién pertenece el trabajo encolado (plan offline, B6).
 *
 * La cola sobrevive al cierre de sesión —contiene ventas que aún no están en
 * el servidor— así que hace falta saber de quién es cada operación. En un
 * mostrador compartido, las ventas de quien salió no pueden subirse con la
 * sesión de quien entró: quedarían registradas a nombre equivocado y
 * falsearían las ventas por trabajador.
 *
 * Se usa el `sub` del token, que es el identificador real del usuario en el
 * backend y no cambia al refrescar la sesión. El correo queda como respaldo
 * porque es lo único que la aplicación guarda del usuario en la sesión.
 */
import { sessionStore } from "@/lib/session-store";

export function currentQueueOwner(): string | null {
  if (typeof window === "undefined") return null;

  const fromToken = subjectFromToken(sessionStore.getItem("token"));
  if (fromToken) return fromToken;

  try {
    const stored = sessionStore.getItem("user");
    if (!stored) return null;
    const email = (JSON.parse(stored) as { email?: unknown }).email;
    return typeof email === "string" && email ? email : null;
  } catch {
    return null;
  }
}

/** `sub` del JWT, sin verificar la firma: aquí solo identifica, no autoriza. */
function subjectFromToken(token: string | null): string | null {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const sub = (JSON.parse(json) as { sub?: unknown }).sub;
    return typeof sub === "string" && sub ? sub : null;
  } catch {
    return null;
  }
}
