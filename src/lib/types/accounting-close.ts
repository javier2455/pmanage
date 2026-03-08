import { InventoryEntry } from "./inventory";
import { SaleWithProductAndBusiness } from "./sales";

export type AccountingCloseDailyResponse = {
    date: string;
    sales: SaleWithProductAndBusiness[];
    inventoryEntries: InventoryEntry[];
    totalIncome: number;
    totalExpense: number;
    total: number;
}