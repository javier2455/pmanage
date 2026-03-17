import { getAllPlans } from "@/lib/api/plans";
import { useQuery } from "@tanstack/react-query";

export function useGetAllPlans() {
    return useQuery({
        queryKey: ["all-plans"],
        queryFn: () => getAllPlans(),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
    });
}