import apiClient from "@/lib/axios";
import { businessRoutes } from "../routes/business";
import type {
  BusinessSettings,
  UpdateBusinessSettingsPayload,
} from "../types/business-settings";

/**
 * Capa API de configuración de alertas del negocio.
 * Contrato backend: docs/API.md.
 *
 * El backend crea la config al crear el negocio, por lo que solo necesitamos
 * leer (GET) y actualizar parcialmente (PATCH); no hay flujo de creación.
 */

/** Obtiene la configuración de alertas del negocio. */
export async function getBusinessSettings(
  businessId: string,
): Promise<BusinessSettings> {
  const { data } = await apiClient.get<BusinessSettings>(
    businessRoutes.settings(businessId),
  );
  return data;
}

/** Actualiza parcialmente la configuración de alertas del negocio. */
export async function updateBusinessSettings(
  businessId: string,
  payload: UpdateBusinessSettingsPayload,
): Promise<BusinessSettings> {
  const { data } = await apiClient.patch<BusinessSettings>(
    businessRoutes.settings(businessId),
    payload,
  );
  return data;
}
