import apiClient from "@/lib/axios";
import { expensesRoutes } from "../routes/expenses";
import {
  CreateExpenseCategoryProps,
  ExpenseCategory,
  ExpenseCategoryWithBusiness,
  GetAllExpenseCategoriesResponse,
  UpdateExpenseCategoryProps,
} from "../types/expense-category";

interface GetAllExpenseCategoriesParams {
  page?: number;
  limit?: number;
  businessId?: string;
}

interface RawListResponse {
  message?: string;
  data: ExpenseCategory[];
  total?: number;
  page?: number;
  limit?: number;
}

interface SingleResponse<T> {
  message?: string;
  data: T;
}

export async function getAllExpenseCategories({
  page,
  limit,
  businessId,
}: GetAllExpenseCategoriesParams = {}): Promise<GetAllExpenseCategoriesResponse> {
  const { data } = await apiClient.get<RawListResponse>(
    expensesRoutes.getAllExpenseCategory,
    { params: { page, limit, businessId } },
  );
  // Misma normalización que en `product-category.ts`: el backend puede omitir
  // los campos de paginación y sin esto la tabla se quedaba en "0 categorías".
  const items = data.data ?? [];
  const resolvedTotal = data.total ?? items.length;
  const resolvedPage = data.page ?? page ?? 1;
  const resolvedLimit = data.limit ?? limit ?? items.length;
  return {
    data: items,
    meta: {
      total: resolvedTotal,
      page: resolvedPage,
      limit: resolvedLimit,
      totalPages:
        resolvedLimit > 0 ? Math.ceil(resolvedTotal / resolvedLimit) : 0,
    },
  };
}

export async function getExpenseCategoryById(
  categoryId: string,
): Promise<ExpenseCategoryWithBusiness> {
  const { data } = await apiClient.get<SingleResponse<ExpenseCategoryWithBusiness>>(
    expensesRoutes.getExpenseCategoryById(categoryId),
  );
  return data.data;
}

export async function createExpenseCategory(
  credentials: CreateExpenseCategoryProps,
): Promise<ExpenseCategory> {
  const { data } = await apiClient.post<SingleResponse<ExpenseCategory>>(
    expensesRoutes.createExpenseCategory,
    credentials,
  );
  return data.data;
}

export async function updateExpenseCategory(
  categoryId: string,
  credentials: UpdateExpenseCategoryProps,
): Promise<ExpenseCategory> {
  const { data } = await apiClient.put<SingleResponse<ExpenseCategory>>(
    expensesRoutes.updateExpenseCategory(categoryId),
    credentials,
  );
  return data.data;
}

export async function deleteExpenseCategory(categoryId: string) {
  const { data } = await apiClient.delete(
    expensesRoutes.deleteExpenseCategory(categoryId),
  );
  return data;
}
