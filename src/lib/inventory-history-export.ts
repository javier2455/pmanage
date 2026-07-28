import Papa from "papaparse";

import { downloadBlob } from "@/lib/download";
import { formatAmount, currencyLabel } from "@/lib/currency";
import { normalizeStock } from "@/lib/units";
import {
  inventoryActionTypeLabels,
  type InventoryActionType,
  type InventoryEntry,
} from "@/lib/types/inventory";

/**
 * Tope de filas del CSV. El endpoint pagina, así que exportar significa volver
 * a pedirlo con un límite alto; este número acota la petición para no traerse
 * un historial de años enteros de una vez. Cuando se alcanza, la interfaz avisa
 * de que el archivo va recortado en vez de dar a entender que contiene todo.
 *
 * El PDF y el Excel no pasan por aquí: los genera el backend, que aplica su
 * propio tope (`INVENTORY_HISTORY_EXPORT_LIMIT`).
 */
export const EXPORT_ROW_LIMIT = 1000;

/** Formatos ofrecidos por el menú "Exportar". */
export type InventoryHistoryExportFormat = "csv" | "xlsx" | "pdf";

/** Extensión (y sufijo de nombre de archivo) de cada formato. */
export const EXPORT_FILE_EXTENSION: Record<
  InventoryHistoryExportFormat,
  string
> = {
  csv: "csv",
  xlsx: "xlsx",
  pdf: "pdf",
};

/** Fecha y hora locales en columnas separadas, para poder ordenar en Excel. */
function splitTimestamp(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return { date: iso, time: "" };

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
}

function actionTypeLabel(actionType: string): string {
  return (
    inventoryActionTypeLabels[actionType as InventoryActionType] ?? actionType
  );
}

/**
 * Cantidad como NÚMERO, no como el string crudo del backend.
 *
 * Las columnas son `decimal(10,2)`, así que llegan como "12.00" y el CSV las
 * escribía tal cual: un producto por unidades salía con dos decimales que no
 * significan nada. Devolverlas normalizadas (redondeadas en `ud`) las deja
 * además como número real de Excel, ordenable y sumable.
 */
function quantityCell(
  value: string | null | undefined,
  unit?: string | null,
): number | string {
  if (value === null || value === undefined || value === "") return "";
  return normalizeStock(value, unit);
}

/** Convierte los movimientos a las filas del CSV, ya con cabeceras legibles. */
export function toInventoryHistoryRows(entries: InventoryEntry[]) {
  return entries.map((entry) => {
    const { date, time } = splitTimestamp(entry.createdAt);
    const unit = entry.product?.unit;
    return {
      Fecha: date,
      Hora: time,
      Producto: entry.product?.name ?? "",
      Movimiento: actionTypeLabel(entry.actionType),
      Cantidad: quantityCell(entry.quantity, unit),
      "Stock anterior": quantityCell(entry.previousStock, unit),
      "Stock nuevo": quantityCell(entry.newStock, unit),
      "Precio de adquisición": entry.entryPrice
        ? formatAmount(Number(entry.entryPrice))
        : "",
      Moneda: entry.currency ? currencyLabel(entry.currency) : "",
      Proveedor: entry.supplier ?? "",
      Descripción: entry.description ?? "",
    };
  });
}

/**
 * Genera y descarga el CSV del historial.
 *
 * Se antepone un BOM porque Excel, sin él, abre el archivo en la codificación
 * del sistema y destroza los acentos y la ñ de los nombres de producto.
 */
export function downloadInventoryHistoryCsv(
  entries: InventoryEntry[],
  filename: string,
) {
  const csv = Papa.unparse(toInventoryHistoryRows(entries));
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, filename);
}
