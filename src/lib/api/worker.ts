import apiClient from "@/lib/axios";
import { userRoutes } from "@/lib/routes/user";
import {
  CreateWorkerInput,
  CreateWorkerResponse,
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

export async function createBusinessWorker(
  input: CreateWorkerInput,
): Promise<CreateWorkerResponse> {
  const { data } = await apiClient.post<CreateWorkerResponse>(
    userRoutes.createBusinessWorker,
    input,
  );
  return data;
}
