/**
 * Rangos de fecha por preset, en fechas de calendario locales.
 *
 * Toda consulta con rango del proyecto viaja como `yyyy-MM-dd` y el backend la
 * interpreta como día local completo (`00:00:00` a `23:59:59.999`). Serializar
 * con `toISOString()` rompería eso: convierte a UTC y, al oeste de Greenwich,
 * desplaza la fecha un día hacia atrás. Por eso aquí se construye la cadena a
 * partir de los componentes locales de la fecha y nunca desde el instante UTC.
 *
 * Los presets devuelven el período de calendario COMPLETO, no "hasta hoy": si
 * hoy es miércoles 24, la semana es del lunes 20 al domingo 26. Es lo que el
 * usuario espera leer en la etiqueta del filtro, y como no hay ventas futuras
 * el resultado es el mismo.
 */

export type DateRangePreset = "week" | "month" | "quarter" | "year" | "custom";

export type DateRangeValue = {
  /** Inicio del rango en formato `yyyy-MM-dd`. */
  startDate: string;
  /** Fin del rango en formato `yyyy-MM-dd`, inclusive. */
  endDate: string;
};

/** Serializa una fecha a `yyyy-MM-dd` usando sus componentes LOCALES. */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convierte `yyyy-MM-dd` en una fecha local a medianoche.
 * Devuelve `null` si la cadena no es una fecha de calendario válida.
 */
export function fromLocalDateString(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Descarta fechas imposibles (p. ej. 2026-02-30), que JS desbordaría a marzo.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** Lunes de la semana a la que pertenece `date`. */
export function startOfWeekMonday(date: Date): Date {
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - daysSinceMonday,
  );
}

/** Domingo de la semana a la que pertenece `date`. */
export function endOfWeekSunday(date: Date): Date {
  const monday = startOfWeekMonday(date);
  return new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + 6,
  );
}

/**
 * Rango de calendario completo del preset, tomando `reference` como "hoy".
 * `custom` no tiene rango propio: lo elige el usuario, así que se devuelve el
 * del mes en curso como punto de partida del selector.
 */
export function resolvePresetRange(
  preset: DateRangePreset,
  reference: Date = new Date(),
): DateRangeValue {
  const year = reference.getFullYear();
  const month = reference.getMonth();

  switch (preset) {
    case "week":
      return {
        startDate: toLocalDateString(startOfWeekMonday(reference)),
        endDate: toLocalDateString(endOfWeekSunday(reference)),
      };

    case "quarter": {
      const firstMonthOfQuarter = Math.floor(month / 3) * 3;
      return {
        startDate: toLocalDateString(new Date(year, firstMonthOfQuarter, 1)),
        // Día 0 del mes siguiente = último día del mes anterior.
        endDate: toLocalDateString(new Date(year, firstMonthOfQuarter + 3, 0)),
      };
    }

    case "year":
      return {
        startDate: toLocalDateString(new Date(year, 0, 1)),
        endDate: toLocalDateString(new Date(year, 11, 31)),
      };

    case "month":
    case "custom":
    default:
      return {
        startDate: toLocalDateString(new Date(year, month, 1)),
        endDate: toLocalDateString(new Date(year, month + 1, 0)),
      };
  }
}
