import apiClient from "@/lib/axios";
import { userRoutes } from "../routes/user";
import {
    DeactivateAccountPayload,
    DeactivateAccountResponse,
    GetAllUsersParams,
    ReactivateAccountResponse,
    UpdateUserFormPayload,
    UsersListResponse,
    UserPlanStatsResponse,
} from "../types/user";

export async function getAllUsersData(
    params: GetAllUsersParams = {},
): Promise<UsersListResponse> {
    const search = params.search?.trim() ? params.search.trim() : undefined;
    const { data } = await apiClient.get<UsersListResponse>(userRoutes.getUserData, {
        params: {
            page: params.page,
            limit: params.limit,
            search,
        },
    });

    return data;
}

export async function getUserPlanStats(): Promise<UserPlanStatsResponse> {
    const { data } = await apiClient.get<UserPlanStatsResponse>(
        userRoutes.getUserPlanStats,
    );
    return data;
}

export async function updateUser(userId: string, payload: UpdateUserFormPayload) {
    const formData = new FormData();

    if (payload.name) formData.append("name", payload.name);
    if (payload.description) formData.append("description", payload.description);
    if (payload.phone) formData.append("phone", payload.phone);
    if (payload.password) formData.append("password", payload.password);
    if (payload.avatar) formData.append("avatar", payload.avatar);

    const { data } = await apiClient.put(userRoutes.updateUser(userId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
}

export async function deactivateAccount(
    payload: DeactivateAccountPayload = {},
): Promise<DeactivateAccountResponse> {
    const { data } = await apiClient.post<DeactivateAccountResponse>(
        userRoutes.deactivate,
        payload,
    );
    return data;
}

export async function reactivateAccount(): Promise<ReactivateAccountResponse> {
    const { data } = await apiClient.post<ReactivateAccountResponse>(
        userRoutes.reactivate,
        {},
    );
    return data;
}