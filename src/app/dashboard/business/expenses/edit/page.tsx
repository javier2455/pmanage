import { Suspense } from "react";
import ExpenseEditClient from "./expense-edit-client";

export default function EditExpensePage() {
  return (
    <Suspense>
      <ExpenseEditClient />
    </Suspense>
  );
}
