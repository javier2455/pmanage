import apiClient from "@/lib/axios";
import { userRoutes } from "@/lib/routes/user";
import {
  CreateWorkerInput,
  CreateWorkerResponse,
  DeleteWorkerResponse,
  GetWorkerByIdResponse,
  UpdateWorkerInput,
  UpdateWorkerResponse,
  WorkersResponseInterface,
} from "@/lib/types/worker";

interface GetAllBusinessWorkersParams {
  businessId: string;
  page?: number;
  limit?: number;
}

export async function getAllBusinessWorkers({
  businessId,
  page,
  limit,
}: GetAllBusinessWorkersParams): Promise<WorkersResponseInterface> {
  const { data } = await apiClient.get<WorkersResponseInterface>(
    userRoutes.getAllBusinessWorkers(businessId),
    { params: { page, limit } },
  );
  return data;
}

export async function getBusinessWorkerById(
  workerId: string,
): Promise<GetWorkerByIdResponse> {
  const { data } = await apiClient.get<GetWorkerByIdResponse>(
    userRoutes.getBusinessWorkerbyID(workerId),
  );
  return data;
}

export async function createBusinessWorker(
  input: CreateWorkerInput,
): Promise<CreateWorkerResponse> {
  const { data } = await apiClient.post<CreateWorkerResponse>(
    userRoutes.createBusinessWorker,
    input,
  );
  return data;
}

export async function updateBusinessWorker(
  workerId: string,
  input: UpdateWorkerInput,
): Promise<UpdateWorkerResponse> {
  const { data } = await apiClient.patch<UpdateWorkerResponse>(
    userRoutes.updateBusinessWorker(workerId),
    input,
  );
  return data;
}

export async function deleteBusinessWorker(
  workerId: string,
): Promise<DeleteWorkerResponse> {
  const { data } = await apiClient.delete<DeleteWorkerResponse>(
    userRoutes.deleteBusinessWorker(workerId),
  );
  return data;
}
