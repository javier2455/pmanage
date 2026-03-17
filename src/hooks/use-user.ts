import { getAllUsersData } from "@/lib/api/user";
import { useQuery } from "@tanstack/react-query";

export function useGetAllUsersData() {
    return useQuery({
        queryKey: ["all-users"],
        queryFn: () => getAllUsersData(),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
    });
}