import apiClient from "@/lib/axios";
import { userRoutes } from "../routes/user";
import { UserDataResponse } from "../types/user";

export async function getAllUsersData(): Promise<UserDataResponse[]> {
    const { data } = await apiClient.get(userRoutes.getUserData);

    return data;
}