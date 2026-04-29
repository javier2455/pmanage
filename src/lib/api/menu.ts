import apiClient from "@/lib/axios";
import { menuRoutes } from "../routes/menu";
import { GetAllMenuItemsResponse } from "../types/menu";

export async function getAllMenuItems(): Promise<GetAllMenuItemsResponse> {
  const { data } = await apiClient.get<GetAllMenuItemsResponse>(
    menuRoutes.getAllMenuItems,
  );
  return data;
}
