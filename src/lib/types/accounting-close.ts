import { SaleWithProductAndBusiness } from "./sales";

export interface DateRangeParameters {
    startDate?: string;
    endDate?: string;
}

export interface ExpenseInAccountingClose {
    id: string;
    title: string;
    amount: number;
    description: string;
    createdAt: string;
}

export type AccountingCloseResponse = {
    date: string;
    sales: SaleWithProductAndBusiness[];
    expenses: ExpenseInAccountingClose[];
    totalIncome: number;
    totalExpense: number;
    total: number;
}