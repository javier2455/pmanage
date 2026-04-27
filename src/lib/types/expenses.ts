export interface Expense {
  id: string;
  title: string;
  amount: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllExpensesResponse {
  data: Expense[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateExpenseProps {
  idbusiness: string;
  title: string;
  amount: number;
  description: string;
}

export type UpdateExpenseProps = Partial<{
  title: string;
  amount: number;
  description: string;
}>;
