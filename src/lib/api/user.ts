import axios from "axios";
import { userRoutes } from "../routes/user";
import { UserDataResponse } from "../types/user";

export async function getAllUsersData(): Promise<UserDataResponse[]> {
    const { data } = await axios.get(userRoutes.getUserData, {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });

    return data;
}