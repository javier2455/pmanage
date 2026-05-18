import { redirect } from "next/navigation";

export function generateStaticParams() {
  return [{ expenseId: "__dynamic__" }];
}

export default function EditExpensePage() {
  redirect("/dashboard/business/expenses");
}
