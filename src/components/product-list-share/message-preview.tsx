"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductListSheetPreview } from "@/lib/types/product-list";

interface MessagePreviewProps {
  messages: string[];
  sheets: ProductListSheetPreview[];
  productCount: number;
  isLoading: boolean;
  isError: boolean;
  hasSelection: boolean;
  /** Modo imagen: la previa se genera a petición, no en cada tecla. */
  needsGeneration?: boolean;
}

export function MessagePreview({
  messages,
  sheets,
  productCount,
  isLoading,
  isError,
  hasSelection,
  needsGeneration,
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

  if (needsGeneration) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Pulsa &laquo;Generar vista previa&raquo; para componer las láminas con
        las fotos de los productos.
      </div>
    );
  }

  const messageCount = sheets.length > 0 ? sheets.length : messages.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto">
        {sheets.map((sheet, index) => (
          <figure
            key={index}
            className="overflow-hidden rounded-lg rounded-tl-none bg-muted/60"
          >
            {/* La lámina viene en base64 desde el backend: es exactamente la
                misma imagen que se enviará. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sheet.image}
              alt={`Lámina ${index + 1} de ${sheets.length}`}
              className="w-full"
            />
            {sheet.caption && (
              <figcaption className="whitespace-pre-wrap break-words p-3 text-sm leading-relaxed">
                {sheet.caption}
              </figcaption>
            )}
          </figure>
        ))}

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
        {messageCount} {messageCount === 1 ? "mensaje" : "mensajes"}
        {messageCount > 1 && " (se reenvían por separado)"}
      </p>
    </div>
  );
}
