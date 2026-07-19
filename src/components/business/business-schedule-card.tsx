"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock, Eraser, Info, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { sileo } from "sileo";
import {
  useBusinessSchedule,
  useUpsertBusinessSchedule,
} from "@/hooks/use-business-schedule";
import {
  businessScheduleFormSchema,
  type BusinessScheduleFormData,
} from "@/lib/validations/business-schedule";
import type {
  BusinessSchedule,
  CreateBusinessScheduleDto,
} from "@/lib/types/business-schedule";
import type { Business } from "@/lib/types/business";

/**
 * Card de horario de atención del negocio (docs/funcionalidad.md).
 *
 * Muestra una fila por día (Lunes → Domingo). El formulario siempre envía los
 * 7 días al guardar: el PUT reemplaza el horario completo, así lo guardado
 * coincide siempre con lo que ve el usuario. Los días cerrados van con
 * `isClosed: true` y sin horas.
 */

/** Orden de presentación (Lunes primero) con su `dayOfWeek` del contrato. */
const DAYS: { dayOfWeek: number; label: string }[] = [
  { dayOfWeek: 1, label: "Lunes" },
  { dayOfWeek: 2, label: "Martes" },
  { dayOfWeek: 3, label: "Miércoles" },
  { dayOfWeek: 4, label: "Jueves" },
  { dayOfWeek: 5, label: "Viernes" },
  { dayOfWeek: 6, label: "Sábado" },
  { dayOfWeek: 0, label: "Domingo" },
];

/**
 * Recorta una hora del backend a "HH:mm". Las columnas son MySQL `TIME`, que el
 * driver devuelve como "HH:mm:ss" (con segundos), mientras que el `<input
 * type="time">` y la validación trabajan en "HH:mm". Sin este recorte, un valor
 * como "08:00:00" se muestra bien en el input pero falla la validación
 * (`"Indica la hora de apertura (HH:mm)"`) tras recargar el horario guardado.
 * Idempotente: "08:00" → "08:00".
 */
function toHHmm(time: string | null | undefined): string {
  if (!time) return "";
  const match = /^(\d{2}):(\d{2})/.exec(time);
  return match ? `${match[1]}:${match[2]}` : "";
}

/** Construye las filas del formulario a partir de la respuesta del backend. */
function buildFormDays(
  schedule: BusinessSchedule[] | undefined,
): BusinessScheduleFormData["days"] {
  return DAYS.map(({ dayOfWeek }) => {
    const record = schedule?.find((s) => s.dayOfWeek === dayOfWeek);
    // Día sin registro → se muestra como cerrado hasta que se configure.
    if (!record) {
      return { dayOfWeek, isClosed: true, openTime: "", closeTime: "" };
    }
    return {
      dayOfWeek,
      isClosed: record.isClosed,
      openTime: toHHmm(record.openTime),
      closeTime: toHHmm(record.closeTime),
    };
  });
}

/** Convierte las filas del formulario al payload del PUT. */
function formToPayload(
  days: BusinessScheduleFormData["days"],
): CreateBusinessScheduleDto[] {
  return days.map((day) =>
    day.isClosed
      ? { dayOfWeek: day.dayOfWeek, isClosed: true }
      : {
          dayOfWeek: day.dayOfWeek,
          isClosed: false,
          openTime: day.openTime,
          closeTime: day.closeTime,
        },
  );
}

export function BusinessScheduleCard({
  business,
}: {
  business: Business | null;
}) {
  const businessId = business?.id;

  const { data: schedule, isLoading } = useBusinessSchedule(businessId);
  const { mutate: saveSchedule, isPending } = useUpsertBusinessSchedule();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BusinessScheduleFormData>({
    resolver: zodResolver(businessScheduleFormSchema),
    defaultValues: { days: buildFormDays(undefined) },
  });

  const { fields } = useFieldArray({ control, name: "days" });

  // Sincroniza el formulario con el horario que llega del backend.
  useEffect(() => {
    if (schedule) reset({ days: buildFormDays(schedule) });
  }, [schedule, reset]);

  function onSubmit(data: BusinessScheduleFormData) {
    if (!businessId) return;
    saveSchedule(
      { businessId, schedules: formToPayload(data.days) },
      {
        onSuccess: () => sileo.success({ title: "Horario guardado" }),
        onError: () =>
          sileo.error({ title: "No se pudo guardar el horario" }),
      },
    );
  }

  // Deja los 7 días como cerrados y sin horas (mismo estado que un negocio sin
  // horario). Solo limpia el formulario: los cambios no se persisten hasta
  // "Guardar horario", así que si fue un clic accidental basta con recargar.
  function handleClear() {
    reset({ days: buildFormDays(undefined) });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">
              Horario de atención
            </CardTitle>
            <CardDescription>
              Define los días y horas en que el negocio abre al público.
            </CardDescription>
          </div>
        </div>
        <div className="mt-3 flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            La <strong>hora de cierre</strong> de cada día se usa también para
            enviarte el <strong>cierre diario</strong> (y el mensual, el último
            día del mes) por los canales que tengas activados en Notificaciones.
            Si no defines horario, se envía a las 23:00.
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando horario…
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Grid de cards por día (Lunes → Domingo). 1 col en móvil, 2 en
                tablet y 4 en escritorio. Los días cerrados se atenúan para que
                los activos resalten. */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fields.map((field, index) => {
                const isClosed = watch(`days.${index}.isClosed`);
                const dayErrors = errors.days?.[index];
                const errorMessage =
                  dayErrors?.openTime?.message ?? dayErrors?.closeTime?.message;
                return (
                  <div
                    key={field.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border p-3 transition-colors",
                      isClosed ? "border-border bg-muted/30" : "border-border bg-card",
                    )}
                  >
                    {/* Día + toggle abierto/cerrado */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-card-foreground">
                        {DAYS[index].label}
                      </span>
                      <Controller
                        control={control}
                        name={`days.${index}.isClosed`}
                        render={({ field: ctl }) => (
                          <Switch
                            checked={!ctl.value}
                            onCheckedChange={(open) => ctl.onChange(!open)}
                            aria-label={`${DAYS[index].label} abierto`}
                          />
                        )}
                      />
                    </div>

                    {/* Horas o etiqueta "Cerrado" */}
                    {isClosed ? (
                      <span className="text-sm text-muted-foreground">Cerrado</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {/* Inputs CONTROLADOS (Controller), no `register`. Estos
                            campos se montan/desmontan según `isClosed`, y
                            useFieldArray rastrea los valores por el ciclo de
                            montaje de inputs no controlados: con `register` los
                            valores se pierden internamente al alternar días
                            (el DOM los conserva pero RHF los lee vacíos → error
                            de validación en todas las cards). Con Controller el
                            valor vive en el estado de RHF y no puede divergir. */}
                        <div className="flex items-center gap-2">
                          <Controller
                            control={control}
                            name={`days.${index}.openTime`}
                            render={({ field: ctl }) => (
                              <Input
                                type="time"
                                className="min-w-0 flex-1"
                                aria-label={`Hora de apertura ${DAYS[index].label}`}
                                aria-invalid={dayErrors?.openTime ? "true" : "false"}
                                {...ctl}
                              />
                            )}
                          />
                          <span className="text-sm text-muted-foreground">–</span>
                          <Controller
                            control={control}
                            name={`days.${index}.closeTime`}
                            render={({ field: ctl }) => (
                              <Input
                                type="time"
                                className="min-w-0 flex-1"
                                aria-label={`Hora de cierre ${DAYS[index].label}`}
                                aria-invalid={dayErrors?.closeTime ? "true" : "false"}
                                {...ctl}
                              />
                            )}
                          />
                        </div>
                        {errorMessage && (
                          <p className="text-xs text-destructive">{errorMessage}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isPending}
              >
                <Eraser className="h-4 w-4" />
                Limpiar
              </Button>
              <Button type="submit" disabled={isPending || !businessId}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar horario
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
