"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex max-w-md flex-col items-center gap-2 text-center">
        <AlertCircle
          className="size-10 shrink-0 text-destructive"
          aria-hidden
        />
        <h2 className="text-lg font-semibold text-foreground">
          Algo salió mal
        </h2>
        <p className="text-sm text-muted-foreground">
          No pudimos cargar esta sección. Puedes intentar de nuevo.
        </p>
      </div>
      <Button type="button" onClick={() => reset()}>
        Reintentar
      </Button>
    </div>
  );
}
