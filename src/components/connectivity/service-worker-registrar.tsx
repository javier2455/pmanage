"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/base-path";

/**
 * Registra el service worker que permite abrir y navegar la app sin conexión
 * (plan offline, B1).
 *
 * Se monta una sola vez en el layout raíz. No renderiza nada.
 *
 * Solo se registra en producción: en desarrollo, un service worker cacheando
 * la aplicación entera hace que los cambios no se vean y produce sesiones de
 * depuración desconcertantes. Además, `sw.js` únicamente existe en el build
 * (`out/`), no en el servidor de desarrollo.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register(withBasePath("/sw.js"), { scope: withBasePath("/") })
        .catch((error) => {
          // Un fallo aquí degrada la app a "solo online", que es justo el
          // comportamiento anterior: se registra y se sigue.
          console.warn("[sw] No se pudo registrar el service worker:", error);
        });
    };

    // Tras `load`: el precache descarga varios MB y compite por el ancho de
    // banda con lo que el usuario está esperando ver en pantalla.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
