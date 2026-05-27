import apiClient from "@/lib/axios";
import { providerRoutes } from "../routes/provider";
import {
  CreateProviderProps,
  CreateProviderResponse,
  GetAllProvidersParams,
  GetAllProvidersResponse,
  GetProviderByIdResponse,
  UpdateProviderProps,
  UpdateProviderResponse,
} from "../types/provider";

export async function getAllProviders({
  page,
  limit,
  businessId,
}: GetAllProvidersParams = {}): Promise<GetAllProvidersResponse> {
  const { data } = await apiClient.get<GetAllProvidersResponse>(
    providerRoutes.getAllProviders,
    { params: { page, limit, businessId } },
  );
  return data;
}

export async function getProviderById(
  providerId: string,
): Promise<GetProviderByIdResponse> {
  const { data } = await apiClient.get<GetProviderByIdResponse>(
    providerRoutes.getProviderById(providerId),
  );
  return data;
}

export async function createProvider(
  payload: CreateProviderProps,
): Promise<CreateProviderResponse> {
  const { data } = await apiClient.post<CreateProviderResponse>(
    providerRoutes.createProvider,
    payload,
  );
  return data;
}

export async function updateProvider(
  providerId: string,
  payload: UpdateProviderProps,
): Promise<UpdateProviderResponse> {
  const { data } = await apiClient.put<UpdateProviderResponse>(
    providerRoutes.updateProvider(providerId),
    payload,
  );
  return data;
}

export async function deleteProvider(providerId: string) {
  const response = await apiClient.delete(
    providerRoutes.deleteProvider(providerId),
  );

  if (response.status === 204) {
    return {
      success: true,
      message: "Proveedor eliminado correctamente",
    };
  }
  return {
    success: false,
    message: "Error al eliminar el proveedor",
  };
}
