import { DASH } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Fecha relativa en español ("hace 2 horas") a partir de un ISO del backend.
 *
 * Devuelve cadena vacía si el valor no es una fecha válida: estas etiquetas son
 * secundarias dentro de listas y notificaciones, y no deben tumbar el render de
 * la fila que las acompaña.
 */
export function formatRelativeTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
  } catch {
    return "";
  }
}

/**
 * Fecha con hora en formato compacto ("05 ago 2026, 14:30"). Pensada para
 * celdas de tabla, donde el mes largo desborda la columna.
 */
export function formatDateTimeShort(iso: string | Date) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Fecha con hora y mes en letra ("05 de agosto de 2026, 14:30"). Para fichas de
 * detalle, donde hay sitio y se lee mejor.
 */
export function formatDateTimeLong(iso: string | Date) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Fecha sin hora, mes abreviado ("05 ago 2026"). */
export function formatDateShort(iso: string | Date) {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return DASH;
  }
}
