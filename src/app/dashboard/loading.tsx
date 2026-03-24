import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div
      className="flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-3 p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="size-8 shrink-0 animate-spin text-primary"
        aria-hidden
      />
      <p className="text-sm text-muted-foreground">Cargando…</p>
      <span className="sr-only">Cargando contenido del panel</span>
    </div>
  );
}
