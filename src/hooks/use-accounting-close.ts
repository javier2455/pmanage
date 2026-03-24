import { useQuery } from "@tanstack/react-query";
import { getDailyAccountingClose, getMonthlyAccountingClose } from "@/lib/api/accounting-close";
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