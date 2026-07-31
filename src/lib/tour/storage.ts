/**
 * Persistencia de las guías interactivas.
 *
 * El reparto sigue el del resto del proyecto:
 *
 * - El tour EN CURSO va a `sessionStorage`, como `token`/`user`/`activeBusinessId`.
 *   Es estado efímero de pestaña: en `localStorage` dos pestañas se pelearían
 *   por el mismo cursor. Además, con `output: export` + `trailingSlash: true`
 *   una navegación mal formada puede degenerar en recarga dura (ver el 308
 *   documentado en `business-details-tabs.tsx`), y sin cursor persistido el
 *   tour moriría ahí.
 * - El "ya vi la bienvenida" va a `localStorage`, que es donde el proyecto
 *   guarda preferencias duraderas (`business-products-view`).
 *
 * Todas las lecturas se hacen desde `useEffect`, nunca en la inicialización
 * perezosa de `useState`: es la convención del repo para no romper hidratación.
 */

const ACTIVE_TOUR_KEY = "negora-tour-active";
const WELCOME_SEEN_KEY = "negora-tour-welcome";

export type ActiveTourCursor = {
  tourId: string;
  stepIndex: number;
};

export function readActiveTour(): ActiveTourCursor | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(ACTIVE_TOUR_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as ActiveTourCursor).tourId === "string" &&
      typeof (parsed as ActiveTourCursor).stepIndex === "number"
    ) {
      return parsed as ActiveTourCursor;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeActiveTour(cursor: ActiveTourCursor): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ACTIVE_TOUR_KEY, JSON.stringify(cursor));
  } catch {
    /* Modo privado o cuota llena: el tour sigue funcionando en memoria. */
  }
}

export function clearActiveTour(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ACTIVE_TOUR_KEY);
  } catch {
    /* Ídem. */
  }
}

export function hasSeenTourWelcome(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(WELCOME_SEEN_KEY) === "1";
  } catch {
    /* Sin storage no podemos recordarlo; mejor no insistir con la invitación. */
    return true;
  }
}

export function markTourWelcomeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WELCOME_SEEN_KEY, "1");
  } catch {
    /* Ídem. */
  }
}
