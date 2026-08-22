"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface MessagePreviewProps {
  messages: string[];
  productCount: number;
  isLoading: boolean;
  isError: boolean;
  hasSelection: boolean;
}

export function MessagePreview({
  messages,
  productCount,
  isLoading,
  isError,
  hasSelection,
}: MessagePreviewProps) {
  if (!hasSelection) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Selecciona productos para ver cómo quedará el mensaje.
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-destructive">
        No se pudo generar la vista previa. Inténtalo de nuevo.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <Skeleton className="h-5 w-1/3" />
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto">
        {messages.map((message, index) => (
          <article
            key={index}
            className="whitespace-pre-wrap break-words rounded-lg rounded-tl-none bg-muted/60 p-4 text-sm leading-relaxed"
          >
            {message}
          </article>
        ))}
      </div>

      <p className="text-right text-xs text-muted-foreground">
        {productCount} {productCount === 1 ? "producto" : "productos"} ·{" "}
        {messages.length}{" "}
        {messages.length === 1 ? "mensaje" : "mensajes"}
        {messages.length > 1 && " (se reenvían por separado)"}
      </p>
    </div>
  );
}
