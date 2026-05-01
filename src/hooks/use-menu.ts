import { useQuery } from "@tanstack/react-query";
import { getAllMenuItems, getMenuList } from "@/lib/api/menu";

interface UseGetAllMenuItemsParams {
  businessId?: string;
  enabled?: boolean;
}

export function useGetAllMenuItemsQuery({
  businessId,
  enabled = true,
}: UseGetAllMenuItemsParams = {}) {
  return useQuery({
    queryKey: ["all-menu-items", businessId ?? null],
    queryFn: () => getAllMenuItems(businessId),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useGetMenuListQuery(enabled = true) {
  return useQuery({
    queryKey: ["menu-list-flat"],
    queryFn: getMenuList,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
