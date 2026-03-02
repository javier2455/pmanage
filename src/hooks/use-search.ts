import { useQuery } from "@tanstack/react-query";
import { getAllMunicipalitiesByProvinceId, getAllProvinces } from "@/lib/api/search";

export function useGetAllProvinces() {
    return useQuery({
        queryKey: ["all-provinces"],
        queryFn: () => getAllProvinces(),
        // enabled: !!productId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
    });
}

export function useGetAllMunicipalitiesByProvinceId(provinceId: string) {
    return useQuery({
        queryKey: ["all-municipalities-by-province-id", provinceId],
        queryFn: () => getAllMunicipalitiesByProvinceId(provinceId),
        enabled: !!provinceId, // evita ejecutar si no hay id
        // staleTime: 1000 * 60, // 1 minuto
    });
}