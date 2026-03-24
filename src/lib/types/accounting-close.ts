import { InventoryEntry } from "./inventory";
import { SaleWithProductAndBusiness } from "./sales";

export interface DateRangeParameters {
    startDate?: string;
    endDate?: string;
}

export type AccountingCloseResponse = {
    date: string;
    sales: SaleWithProductAndBusiness[];
    inventoryEntries: InventoryEntry[];
    totalIncome: number;
    totalExpense: number;
    total: number;
}