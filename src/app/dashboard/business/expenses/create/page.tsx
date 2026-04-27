import Link from "next/link";
import { ArrowLeft, HandCoins } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";

export default function CreateExpensePage() {
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
            Crear gasto
          </h1>
          <p className="text-muted-foreground">
            Registra un nuevo gasto del negocio
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
                Nuevo gasto
              </CardTitle>
              <CardDescription>
                Completa la información del gasto
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ExpenseForm mode="create" />
        </CardContent>
      </Card>
    </section>
  );
}
