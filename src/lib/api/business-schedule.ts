import apiClient from "@/lib/axios";
import { businessRoutes } from "../routes/business";
import type {
  BusinessSchedule,
  CreateBusinessScheduleDto,
} from "../types/business-schedule";

/**
 * Capa API del horario de atención del negocio.
 * Contrato backend: docs/funcionalidad.md.
 *
 * Tanto GET como PUT responden con la forma `{ message, data }`,
 * donde `data` es el arreglo de registros de horario.
 */

interface BusinessScheduleResponse {
  message: string;
  data: BusinessSchedule[];
}

/** Obtiene el horario completo del negocio (0 a 7 registros). */
export async function getBusinessSchedule(
  businessId: string,
): Promise<BusinessSchedule[]> {
  const { data } = await apiClient.get<BusinessScheduleResponse>(
    businessRoutes.schedule(businessId),
  );
  return data.data;
}

/**
 * Reemplaza el horario completo del negocio (upsert por día).
 * Devuelve los registros guardados/actualizados.
 */
export async function upsertBusinessSchedule(
  businessId: string,
  schedules: CreateBusinessScheduleDto[],
): Promise<BusinessSchedule[]> {
  const { data } = await apiClient.put<BusinessScheduleResponse>(
    businessRoutes.schedule(businessId),
    { schedules },
  );
  return data.data;
}
