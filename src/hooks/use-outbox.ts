"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { liveQuery } from "dexie";
import { useQueryClient } from "@tanstack/react-query";
import { offlineDb } from "@/lib/db/offline-db";
import { countOutbox } from "@/lib/offline/outbox-policy";
import {
  listOutbox,
  recoverStaleInflight,
  retryNow,
  discardOperation,
} from "@/lib/offline/outbox";
import type { OutboxCounts, OutboxOp } from "@/lib/offline/outbox-types";
import { currentQueueOwner } from "@/lib/offline/queue-owner";
import { runSync, type SyncRunResult } from "@/lib/offline/sync-runner";
import { invalidateAfterSale } from "./use-sales";

export interface OutboxState {
  operations: OutboxOp[];
  counts: OutboxCounts;
  isSyncing: boolean;
  lastResult: SyncRunResult | null;
  /** Sube la cola del negocio activo. Devuelve null si no hay a quién atribuirla. */
  sync: () => Promise<SyncRunResult | null>;
  retry: (seq: number) => Promise<void>;
  discard: (seq: number) => Promise<void>;
}

const EMPTY_COUNTS: OutboxCounts = {
  pending: 0,
  failed: 0,
  rejected: 0,
  inflight: 0,
  unsynced: 0,
};

/**
 * Estado de la cola de operaciones para la interfaz (plan offline, B6).
 *
 * La lista se observa con `liveQuery` de Dexie: cualquier cambio en la base
 * —encolar una venta, subir el lote, incluso desde otra pestaña— repinta el
 * contador solo. Sin eso habría que acordarse de refrescar en cada sitio que
 * toca la cola, y el contador acabaría mintiendo justo cuando más importa.
 */
export function useOutbox(businessId: string | null): OutboxState {
  const queryClient = useQueryClient();
  const [operations, setOperations] = useState<OutboxOp[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncRunResult | null>(null);

  useEffect(() => {
    if (!offlineDb()) return;
    const subscription = liveQuery(() =>
      businessId ? listOutbox(businessId) : Promise.resolve([]),
    ).subscribe({
      next: setOperations,
      // Sin acceso a la base no hay contador; lo que ya estuviera guardado
      // sigue ahí y se verá cuando el navegador vuelva a dar permiso.
      error: () => setOperations([]),
    });
    return () => subscription.unsubscribe();
  }, [businessId]);

  // Operaciones que se quedaron a medio subir (pestaña cerrada, batería
  // agotada). Sin esto seguirían en `inflight`, que no se reintenta nunca.
  useEffect(() => {
    void recoverStaleInflight();
  }, []);

  const counts = useMemo(
    () => (operations.length > 0 ? countOutbox(operations) : EMPTY_COUNTS),
    [operations],
  );

  const sync = useCallback(async (): Promise<SyncRunResult | null> => {
    const owner = currentQueueOwner();
    if (!businessId || !owner) return null;

    setIsSyncing(true);
    try {
      const result = await runSync({ businessId, userId: owner });
      setLastResult(result);
      // Las ventas subidas cambian inventario, cierres y resumen: lo que ya
      // está en pantalla quedó obsoleto en el mismo instante.
      if (result.applied > 0) invalidateAfterSale(queryClient, businessId);
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [businessId, queryClient]);

  const retry = useCallback(async (seq: number) => {
    await retryNow(seq);
  }, []);

  const discard = useCallback(async (seq: number) => {
    await discardOperation(seq);
  }, []);

  return { operations, counts, isSyncing, lastResult, sync, retry, discard };
}
