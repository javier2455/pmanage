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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Loader2, Save } from "lucide-react";
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
      openTime: record.openTime ?? "",
      closeTime: record.closeTime ?? "",
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
    register,
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando horario…
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {fields.map((field, index) => {
                const isClosed = watch(`days.${index}.isClosed`);
                const dayErrors = errors.days?.[index];
                return (
                  <div
                    key={field.id}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    {/* Día + toggle abierto/cerrado */}
                    <div className="flex items-center gap-3 sm:w-44">
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
                      <span className="text-sm font-medium text-card-foreground">
                        {DAYS[index].label}
                      </span>
                    </div>

                    {/* Horas o etiqueta "Cerrado" */}
                    {isClosed ? (
                      <span className="text-sm text-muted-foreground sm:flex-1">
                        Cerrado
                      </span>
                    ) : (
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                        <div className="flex flex-col gap-1">
                          <Label
                            htmlFor={`open-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            Apertura
                          </Label>
                          <Input
                            id={`open-${index}`}
                            type="time"
                            className="w-full sm:w-36"
                            aria-label={`Hora de apertura ${DAYS[index].label}`}
                            aria-invalid={dayErrors?.openTime ? "true" : "false"}
                            {...register(`days.${index}.openTime`)}
                          />
                          {dayErrors?.openTime && (
                            <p className="text-xs text-destructive">
                              {dayErrors.openTime.message}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label
                            htmlFor={`close-${index}`}
                            className="text-xs text-muted-foreground"
                          >
                            Cierre
                          </Label>
                          <Input
                            id={`close-${index}`}
                            type="time"
                            className="w-full sm:w-36"
                            aria-label={`Hora de cierre ${DAYS[index].label}`}
                            aria-invalid={dayErrors?.closeTime ? "true" : "false"}
                            {...register(`days.${index}.closeTime`)}
                          />
                          {dayErrors?.closeTime && (
                            <p className="text-xs text-destructive">
                              {dayErrors.closeTime.message}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
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
