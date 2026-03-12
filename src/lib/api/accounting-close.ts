import axios from "axios";
import { AccountingCloseDailyResponse } from "../types/accounting-close";
import { accountingCloseRoutes } from "../routes/accounting-close";

export async function getDailyAccountingClose(businessId: string): Promise<AccountingCloseDailyResponse> {
    const { data } = await axios.get(accountingCloseRoutes.getDailyAccountingClose(businessId), {
        headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
    });
    return data;
}