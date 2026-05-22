import ExpenseEditClient from "./expense-edit-client";

export function generateStaticParams() {
  return [{ expenseId: "__dynamic__" }];
}

export default function EditExpensePage() {
  return <ExpenseEditClient />;
}
