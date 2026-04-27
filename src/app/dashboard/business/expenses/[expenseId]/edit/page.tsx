"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, HandCoins, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { useGetExpenseByIdQuery } from "@/hooks/use-expenses";

interface EditExpensePageProps {
  params: Promise<{ expenseId: string }>;
}

export default function EditExpensePage({ params }: EditExpensePageProps) {
  const { expenseId } = use(params);
  const { data, isLoading, isError } = useGetExpenseByIdQuery(expenseId);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/expenses"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Editar gasto
          </h1>
          <p className="text-muted-foreground">
            Actualiza la información del gasto
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <HandCoins className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-card-foreground">
                Editar gasto
              </CardTitle>
              <CardDescription>
                Modifica los campos del gasto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError || !data ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <p className="text-muted-foreground text-center">
                No se encontró el gasto. Vuelve a la lista de gastos e inténtalo de nuevo.
              </p>
              <Link
                href="/dashboard/business/expenses"
                className="text-sm text-primary hover:underline"
              >
                Volver a gastos
              </Link>
            </div>
          ) : (
            <ExpenseForm
              mode="edit"
              expenseId={expenseId}
              defaultValues={{
                title: data.title,
                amount: Number(data.amount),
                description: data.description,
              }}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
