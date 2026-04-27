import { BASIC_ROUTE } from ".";

export const expensesRoutes = {
  getAllExpenses: `${BASIC_ROUTE}/expenses`,
  // getAllSalesByBusinessId: (businessId: string) => `${BASIC_ROUTE}/sales/business/${businessId}`,
  getExpenseById: (expenseId: string) => `${BASIC_ROUTE}/expenses/${expenseId}`,
  createExpense: `${BASIC_ROUTE}/expenses`,
  updateExpense: (expenseId: string) => `${BASIC_ROUTE}/expenses/${expenseId}`,
  deleteExpense: (expenseId: string) => `${BASIC_ROUTE}/expenses/${expenseId}`,
};
