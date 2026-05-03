"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { WorkerForm } from "@/components/workers/worker-form";
import { useGetWorkerByIdQuery } from "@/hooks/use-workers";

interface EditWorkerPageProps {
  params: Promise<{ workerId: string }>;
}

export default function EditWorkerPage({ params }: EditWorkerPageProps) {
  const { workerId } = use(params);
  const { data, isLoading, isError } = useGetWorkerByIdQuery(workerId);

  if (isLoading) {
    return (
      <section className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (isError || !data?.data) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/business/workers"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Editar trabajador
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-muted-foreground text-center">
            No se encontró el trabajador. Vuelve a la lista de trabajadores e
            inténtalo de nuevo.
          </p>
          <Link
            href="/dashboard/business/workers"
            className="text-sm text-primary hover:underline"
          >
            Volver a trabajadores
          </Link>
        </div>
      </section>
    );
  }

  return <WorkerForm mode="edit" worker={data.data} />;
}
