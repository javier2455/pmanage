"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * ¿Está la APLICACIÓN guardada en el dispositivo? (plan offline, B1)
 *
 * No los datos —eso es `usePrepareOffline`—, sino el código: sin él el
 * navegador no llega ni a abrir la pantalla, y da su propio error, desde el
 * que no se puede volver a ninguna parte.
 *
 * Esto existe porque su ausencia costó varias rondas de depuración a ciegas.
 * El precacheado es todo o nada y falla en silencio: una conexión que se corta
 * a mitad deja el dispositivo sin copia de la aplicación, sin ningún rastro
 * visible, mientras el aviso de "datos guardados" sigue diciendo que todo está
 * listo. Enseñarlo convierte «me sale un error rarísimo» en una frase que
 * dice qué pasa.
 */

export type AppShellState =
  /** El navegador tiene la aplicación completa guardada. */
  | "ready"
  /** La está descargando ahora mismo. */
  | "installing"
  /** No hay copia: sin conexión la aplicación no abriría. */
  | "absent"
  /** Aún no se sabe (no ha contestado). */
  | "unknown";

export interface AppShellReport {
  /** Hay un service worker sirviendo ESTA página. */
  controlled: boolean;
  precached: number;
  total: number;
}

export interface AppShellStatus {
  state: AppShellState;
  version: string | null;
  precached: number;
  total: number;
  refresh: () => void;
}

/**
 * Se extrae del hook para poder probarlo. La distinción que importa es
 * `absent` frente a `installing`: la primera exige conexión para arreglarse y
 * la segunda se arregla sola esperando, así que confundirlas manda a la
 * persona a hacer justo lo contrario de lo que necesita.
 */
export function resolveAppShellState(report: AppShellReport | null): AppShellState {
  if (!report) return "unknown";
  if (!report.controlled) return "absent";
  if (report.total > 0 && report.precached >= report.total) return "ready";
  return "installing";
}

/** Lo que se le pregunta al service worker, con corte por si no contesta. */
const ANSWER_TIMEOUT_MS = 2_000;

async function askServiceWorker(): Promise<
  { version: string; precached: number; total: number } | null
> {
  const worker = navigator.serviceWorker?.controller;
  if (!worker) return null;

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), ANSWER_TIMEOUT_MS);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      const data = event.data;
      resolve(
        data && typeof data === "object" && typeof data.total === "number"
          ? data
          : null,
      );
    };
    worker.postMessage("STATUS", [channel.port2]);
  });
}

export function useAppShellStatus(): AppShellStatus {
  const [report, setReport] = useState<AppShellReport | null>(null);
  const [version, setVersion] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      // Un navegador sin service workers no puede guardar la aplicación; que
      // lo diga en vez de quedarse en "no se sabe".
      setReport({ controlled: false, precached: 0, total: 0 });
      return;
    }
    if (!navigator.serviceWorker.controller) {
      setReport({ controlled: false, precached: 0, total: 0 });
      return;
    }
    void askServiceWorker().then((answer) => {
      if (!answer) {
        setReport(null);
        return;
      }
      setVersion(answer.version);
      setReport({
        controlled: true,
        precached: answer.precached,
        total: answer.total,
      });
    });
  }, []);

  useEffect(() => {
    // La primera comprobación va en un turno aparte: llamarla dentro del
    // efecto cambia el estado durante el render y React lo rechaza.
    const timer = setTimeout(refresh, 0);
    const hasServiceWorker =
      typeof navigator !== "undefined" && "serviceWorker" in navigator;

    // Cuando termina de instalarse una versión nueva toma el control: es el
    // momento exacto en que esto pasa de "descargando" a "guardada".
    const onChange = () => refresh();
    if (hasServiceWorker) {
      navigator.serviceWorker.addEventListener("controllerchange", onChange);
    }

    return () => {
      clearTimeout(timer);
      if (hasServiceWorker) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onChange,
        );
      }
    };
  }, [refresh]);

  return {
    state: resolveAppShellState(report),
    version,
    precached: report?.precached ?? 0,
    total: report?.total ?? 0,
    refresh,
  };
}
