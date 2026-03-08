import { useQuery } from "@tanstack/react-query";
import { getDailyAccountingClose } from "@/lib/api/accounting-close";

export function useDailyAccountingClose(businessId: string) {
    return useQuery({
        queryKey: ["daily-accounting-close", businessId],
        queryFn: () => getDailyAccountingClose(businessId),
        enabled: !!businessId,
    });
}