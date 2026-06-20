export interface Expense {
  id: string;
  title: string;
  amount: string | number;
  /**
   * Moneda en la que se registró el gasto (`CUP`, `USD`, `EURO`, `MLC`…). A
   * diferencia de productos, el `amount` se persiste y se muestra en esta moneda
   * original; el backend solo convierte a la base para reportes/alertas. Si el
   * gasto se creó antes de la feature, el backend devuelve `CUP` por defecto.
   * Ver docs/078-expenses-multicurrency-frontend-guide.md.
   */
  currency: string;
  description: string;
  expenseCategoryId?: string | null;
  expenseCategoryName?: string | null;
  createdBy: string;
  userName: string | null;
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
  expenseCategoryId?: string | null;
  /** Moneda del gasto. Si se omite, el backend asume `CUP`. */
  currency?: string;
}

export type UpdateExpenseProps = Partial<{
  title: string;
  amount: number;
  description: string;
  expenseCategoryId: string | null;
  currency: string;
}>;
