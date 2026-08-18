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
        .then(() => void logActiveVersion())
        .catch((error) => {
          // Un fallo aquí degrada la app a "solo online", que es justo el
          // comportamiento anterior: se registra y se sigue.
          console.warn("[sw] No se pudo registrar el service worker:", error);
        });
    };

    // Cuando una versión nueva termina de instalarse y toma el control, se
    // vuelve a anunciar: ese mensaje en consola es la señal de que la descarga
    // completa del build terminó y ya se puede trabajar sin conexión.
    const onControllerChange = () => void logActiveVersion();
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    // Tras `load`: el precache descarga varios MB y compite por el ancho de
    // banda con lo que el usuario está esperando ver en pantalla.
    if (document.readyState === "complete") {
      register();
      return () =>
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onControllerChange,
        );
    }
    window.addEventListener("load", register);
    return () => {
      window.removeEventListener("load", register);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}

/**
 * Deja en consola la versión del service worker que está sirviendo la
 * aplicación.
 *
 * No es adorno: los nombres de los archivos de Next cambian en cada
 * despliegue, así que cuando algo falla en producción lo primero que hay que
 * saber es si el navegador está corriendo el código nuevo o una caché anterior
 * que sigue al mando. Sin este dato, la respuesta a «ya lo desplegué y sigue
 * igual» es adivinar.
 */
async function logActiveVersion(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active;
    if (!worker) return;

    const version = await new Promise<string | null>((resolve) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => resolve(null), 2_000);
      channel.port1.onmessage = (event) => {
        clearTimeout(timer);
        resolve(typeof event.data === "string" ? event.data : null);
      };
      worker.postMessage("VERSION", [channel.port2]);
    });

    if (version) console.info(`[sw] versión activa: ${version}`);
  } catch {
    // Saber la versión es un extra para diagnosticar; nunca puede romper nada.
  }
}
