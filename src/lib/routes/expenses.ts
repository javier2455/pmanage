import { BASIC_ROUTE } from ".";

export const expensesRoutes = {
  getAllExpenses: `${BASIC_ROUTE}/expenses`,
  // getAllSalesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/sales/business/${businessId}`,
  getExpenseById: (expenseId: string) => `${BASIC_ROUTE}/expenses/${expenseId}`,
  createExpense: `${BASIC_ROUTE}/expenses`,
  updateExpense: (expenseId: string) => `${BASIC_ROUTE}/expenses/${expenseId}`,
  deleteExpense: (expenseId: string) => `${BASIC_ROUTE}/expenses/${expenseId}`,


  /* Categories */
  getAllExpenseCategory: `${BASIC_ROUTE}/expense-categories`,
  getExpenseCategoryById: (categoryId: string) =>
    `${BASIC_ROUTE}/expense-categories/${categoryId}`,
  createExpenseCategory: `${BASIC_ROUTE}/expense-categories`,
  updateExpenseCategory: (categoryId: string) =>
    `${BASIC_ROUTE}/expense-categories/${categoryId}`,
  deleteExpenseCategory: (categoryId: string) =>
    `${BASIC_ROUTE}/expense-categories/${categoryId}`,
};
