import apiClient from "@/lib/axios";
import { expensesRoutes } from "../routes/expenses";
import {
  CreateExpenseProps,
  Expense,
  GetAllExpensesResponse,
  UpdateExpenseProps,
} from "../types/expenses";

interface GetAllExpensesParams {
  page?: number;
  limit?: number;
}

export async function getAllExpenses({
  page,
  limit,
}: GetAllExpensesParams = {}): Promise<GetAllExpensesResponse> {
  const { data } = await apiClient.get<GetAllExpensesResponse>(
    expensesRoutes.getAllExpenses,
    { params: { page, limit } },
  );
  return data;
}

export async function getExpenseById(expenseId: string): Promise<Expense> {
  const { data } = await apiClient.get<Expense>(
    expensesRoutes.getExpenseById(expenseId),
  );
  return data;
}

export async function createExpense(
  credentials: CreateExpenseProps,
): Promise<Expense> {
  const { data } = await apiClient.post<Expense>(
    expensesRoutes.createExpense,
    credentials,
  );
  return data;
}

export async function updateExpense(
  expenseId: string,
  credentials: UpdateExpenseProps,
): Promise<Expense> {
  const { data } = await apiClient.patch<Expense>(
    expensesRoutes.updateExpense(expenseId),
    credentials,
  );
  return data;
}

export async function deleteExpense(expenseId: string) {
  const { data } = await apiClient.delete(
    expensesRoutes.deleteExpense(expenseId),
  );
  return data;
}
