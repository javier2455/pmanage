import apiClient from "@/lib/axios";
import { userRoutes } from "../routes/user";
import { UpdateUserFormPayload, UserDataResponse } from "../types/user";

export async function getAllUsersData(): Promise<UserDataResponse[]> {
    const { data } = await apiClient.get(userRoutes.getUserData);

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