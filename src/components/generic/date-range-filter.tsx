"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/generic/date-range-picker";
import {
  fromLocalDateString,
  resolvePresetRange,
  toLocalDateString,
  type DateRangePreset,
  type DateRangeValue,
} from "@/lib/date-range";

const OPTIONS: { label: string; value: DateRangePreset }[] = [
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
  { label: "Trimestre", value: "quarter" },
  { label: "Año", value: "year" },
  { label: "Personalizado", value: "custom" },
];

interface DateRangeFilterProps {
  preset: DateRangePreset;
  range: DateRangeValue;
  onChange: (preset: DateRangePreset, range: DateRangeValue) => void;
  /**
   * Rango realmente consultado, tal y como lo devuelve el backend (ISO). Se
   * prefiere al calculado en cliente para rotular, de modo que lo que se lee
   * sea siempre lo que se consultó.
   */
  effectiveRange?: { startDate: string; endDate: string };
}

/** "20 de julio de 2026" — sin el año cuando ambos extremos comparten año. */
function formatBoundary(date: Date, withYear: boolean): string {
  return format(date, withYear ? "d 'de' MMMM 'de' yyyy" : "d 'de' MMMM", {
    locale: es,
  });
}

function describeRange(start: Date, end: Date): string {
  const sameDay = start.getTime() === end.getTime();
  if (sameDay) return formatBoundary(start, true);

  const sameYear = start.getFullYear() === end.getFullYear();
  return `${formatBoundary(start, !sameYear)} al ${formatBoundary(end, true)}`;
}

export function DateRangeFilter({
  preset,
  range,
  onChange,
  effectiveRange,
}: DateRangeFilterProps) {
  // El backend devuelve el rango en ISO; lo reducimos a la parte de fecha para
  // no arrastrar la hora ni una conversión de zona al rotularlo.
  const label = (() => {
    const startIso = effectiveRange?.startDate?.slice(0, 10) ?? range.startDate;
    const endIso = effectiveRange?.endDate?.slice(0, 10) ?? range.endDate;
    const start = fromLocalDateString(startIso);
    const end = fromLocalDateString(endIso);
    if (!start || !end) return null;
    return describeRange(start, end);
  })();

  function handlePresetChange(next: DateRangePreset) {
    // Al salir de "personalizado" el rango lo dicta el preset; al entrar, se
    // conserva el que ya se está viendo como punto de partida.
    onChange(next, next === "custom" ? range : resolvePresetRange(next));
  }

  function handleStartChange(date: Date | undefined) {
    if (!date) return;
    const startDate = toLocalDateString(date);
    onChange("custom", {
      startDate,
      // Un inicio posterior al fin dejaría el rango invertido y el backend
      // caería al preset, mostrando algo que el usuario no pidió.
      endDate: startDate > range.endDate ? startDate : range.endDate,
    });
  }

  function handleEndChange(date: Date | undefined) {
    if (!date) return;
    const endDate = toLocalDateString(date);
    onChange("custom", {
      startDate: endDate < range.startDate ? endDate : range.startDate,
      endDate,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Seleccionar período"
          className="inline-flex items-center gap-1 rounded-full border border-input bg-muted/40 p-1 shadow-xs"
        >
          {OPTIONS.map((option) => {
            const isActive = preset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handlePresetChange(option.value)}
                className={cn(
                  "relative cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {preset === "custom" ? (
          <DateRangePicker
            startDate={fromLocalDateString(range.startDate) ?? undefined}
            endDate={fromLocalDateString(range.endDate) ?? undefined}
            onStartDateChange={handleStartChange}
            onEndDateChange={handleEndChange}
          />
        ) : null}
      </div>

      {label ? (
        <p className="text-xs text-muted-foreground">
          Mostrando del <span className="font-medium text-foreground">{label}</span>
        </p>
      ) : null}
    </div>
  );
}
