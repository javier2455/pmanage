import apiClient from "@/lib/axios";
import { menuRoutes } from "../routes/menu";
import { GetAllMenuItemsResponse, GetMenuListResponse } from "../types/menu";

export async function getAllMenuItems(
  businessId?: string,
): Promise<GetAllMenuItemsResponse> {
  const { data } = await apiClient.get<GetAllMenuItemsResponse>(
    menuRoutes.getAllMenuItems,
    businessId ? { params: { businessId } } : undefined,
  );
  return data;
}

export async function getMenuList(): Promise<GetMenuListResponse> {
  const { data } = await apiClient.get<GetMenuListResponse>(
    menuRoutes.getAllMenuItems,
    { params: { isList: true } },
  );
  return data;
}
