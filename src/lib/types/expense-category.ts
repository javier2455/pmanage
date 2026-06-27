export interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
  businessId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ExpenseCategoryWithBusiness extends ExpenseCategory {
  business: {
    id: string;
    name: string;
  };
}

export interface GetAllExpenseCategoriesResponse {
  data: ExpenseCategory[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateExpenseCategoryProps {
  name: string;
  description: string;
  businessId: string;
}

export type UpdateExpenseCategoryProps = Partial<{
  name: string;
  description: string;
}>;
