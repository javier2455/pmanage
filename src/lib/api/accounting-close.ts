import axios from "axios";
import { AccountingCloseDailyResponse, DateRangeParameters } from "../types/accounting-close";
import { accountingCloseRoutes } from "../routes/accounting-close";

export async function getDailyAccountingClose(businessId: string, params?: DateRangeParameters): Promise<AccountingCloseDailyResponse> {
    const hasParams = params?.startDate || params?.endDate;
    const baseUrl = hasParams
        ? accountingCloseRoutes.getDailyAccountingCloseByRange(businessId)
        : accountingCloseRoutes.getDailyAccountingClose(businessId);

    const url = new URL(baseUrl);
    if (params?.startDate) url.searchParams.set("startDate", params.startDate);
    if (params?.endDate)   url.searchParams.set("endDate", params.endDate);

    const { data } = await axios.get(url.toString(), {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });
    return data;
}