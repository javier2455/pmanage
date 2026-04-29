import { useQuery } from "@tanstack/react-query";
import { getAllMenuItems } from "@/lib/api/menu";

export function useGetAllMenuItemsQuery() {
  return useQuery({
    queryKey: ["all-menu-items"],
    queryFn: getAllMenuItems,
    staleTime: 5 * 60 * 1000,
  });
}
