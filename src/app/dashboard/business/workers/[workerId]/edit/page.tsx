"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { WorkerForm } from "@/components/workers/worker-form";
import { useGetWorkerById } from "@/hooks/use-workers";

interface EditWorkerPageProps {
  params: Promise<{ workerId: string }>;
}

export default function EditWorkerPage({ params }: EditWorkerPageProps) {
  const { workerId } = use(params);
  const { data: worker, isLoading, isError } = useGetWorkerById(workerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !worker) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/business/workers"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <p className="text-sm text-destructive">
          No se encontró el trabajador solicitado.
        </p>
      </div>
    );
  }

  return <WorkerForm mode="edit" worker={worker} />;
}
