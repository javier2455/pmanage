/**
 * Horario de atención del negocio.
 * Contrato backend: docs/funcionalidad.md.
 *
 * El horario es un arreglo de hasta 7 registros (uno por día de la semana).
 * `dayOfWeek`: 0 = Domingo, 1 = Lunes, ..., 6 = Sábado.
 * Las horas van en formato "HH:mm" (24h) o `null` cuando el día está cerrado.
 */

/** Registro de horario tal como lo devuelve el backend (GET/PUT). */
export interface BusinessSchedule {
  id: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  businessId: string;
}

/**
 * DTO de un día para el upsert (PUT).
 * Si `isClosed = true`, no se envían `openTime`/`closeTime`.
 * Si el día está abierto, ambas horas son obligatorias y `openTime < closeTime`.
 */
export interface CreateBusinessScheduleDto {
  dayOfWeek: number;
  isClosed?: boolean;
  openTime?: string;
  closeTime?: string;
}

/** Payload del PUT: reemplaza el horario completo (upsert por día). */
export interface UpsertBusinessSchedulePayload {
  schedules: CreateBusinessScheduleDto[];
}
