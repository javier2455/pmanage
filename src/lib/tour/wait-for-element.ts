/**
 * Espera a que un selector exista en el DOM.
 *
 * Las vistas cargan sus datos con React Query, así que el ancla de un paso
 * puede tardar en aparecer tras una navegación: resolver contra el DOM del
 * momento fallaría casi siempre.
 *
 * Resuelve con el elemento, o con `null` si se agota el tiempo o se aborta.
 */
export function waitForElement(
  selector: string,
  timeoutMs = 4000,
  signal?: AbortSignal,
): Promise<Element | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    const immediate = document.querySelector(selector);
    if (immediate) {
      resolve(immediate);
      return;
    }

    let timer = 0;

    const settle = (el: Element | null) => {
      observer.disconnect();
      window.clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(el);
    };

    const onAbort = () => settle(null);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) settle(el);
    });

    signal?.addEventListener("abort", onAbort, { once: true });
    timer = window.setTimeout(() => settle(null), timeoutMs);

    /* Solo childList+subtree: con `attributes: true` el callback se dispararía
       en cada transición de Tailwind, que en el sidebar son constantes. */
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
