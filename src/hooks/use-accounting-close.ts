import { useMutation, useQuery } from "@tanstack/react-query";
import { exportToExcel, exportToPdf, getDailyAccountingClose, getMonthlyAccountingClose } from "@/lib/api/accounting-close";
import { DateRangeParameters } from "@/lib/types/accounting-close";

export function useDailyAccountingClose(businessId: string, params?: DateRangeParameters) {
    return useQuery({
        queryKey: ["daily-accounting-close", businessId, params],
        queryFn: () => getDailyAccountingClose(businessId, params),
        enabled: !!businessId,
    });
}

export function useMonthlyAccountingClose(businessId: string, params?: DateRangeParameters) {
    return useQuery({
        queryKey: ["monthly-accounting-close", businessId, params],
        queryFn: () => getMonthlyAccountingClose(businessId, params),
        enabled: !!businessId,
    });
}

export function useExportToPdf(businessId: string) {
    return useMutation({
        mutationFn: (params: DateRangeParameters) => exportToPdf(businessId, params),
    });
}

export function useExportToExcel(businessId: string) {
    return useMutation({
        mutationFn: (params: DateRangeParameters) => exportToExcel(businessId, params),
    });
}