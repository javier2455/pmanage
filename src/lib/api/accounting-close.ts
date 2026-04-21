import apiClient from "@/lib/axios";
import { AccountingCloseResponse, DateRangeParameters } from "../types/accounting-close";
import { accountingCloseRoutes } from "../routes/accounting-close";

export async function getDailyAccountingClose(businessId: string, params?: DateRangeParameters): Promise<AccountingCloseResponse> {
    const hasParams = params?.startDate || params?.endDate;
    const baseUrl = hasParams
        ? accountingCloseRoutes.getDailyAccountingCloseByRange(businessId)
        : accountingCloseRoutes.getDailyAccountingClose(businessId);

    const url = new URL(baseUrl);
    if (params?.startDate) url.searchParams.set("startDate", params.startDate);
    if (params?.endDate) url.searchParams.set("endDate", params.endDate);

    const { data } = await apiClient.get(url.toString());
    return data;
}

export async function getMonthlyAccountingClose(businessId: string, params?: DateRangeParameters): Promise<AccountingCloseResponse> {
    const hasParams = params?.startDate || params?.endDate;
    const baseUrl = hasParams
        ? accountingCloseRoutes.getDailyAccountingCloseByRange(businessId)
        : accountingCloseRoutes.getMonthlyAccountingClose(businessId);

    const url = new URL(baseUrl);
    if (params?.startDate) url.searchParams.set("startDate", params.startDate);
    if (params?.endDate) url.searchParams.set("endDate", params.endDate);

    const { data } = await apiClient.get(url.toString());
    return data;
}

export async function exportToPdf(businessId: string, params?: DateRangeParameters): Promise<Blob> {
    const url = new URL(accountingCloseRoutes.exportToPdf(businessId));
    if (params?.startDate) url.searchParams.set("startDate", params.startDate);
    if (params?.endDate) url.searchParams.set("endDate", params.endDate);

    const { data } = await apiClient.get(url.toString(), { responseType: "blob" });
    return data;
}

export async function exportToExcel(businessId: string, params?: DateRangeParameters): Promise<Blob> {
    const url = new URL(accountingCloseRoutes.exportToExcel(businessId));
    if (params?.startDate) url.searchParams.set("startDate", params.startDate);
    if (params?.endDate) url.searchParams.set("endDate", params.endDate);

    const { data } = await apiClient.get(url.toString(), { responseType: "blob" });
    return data;
}