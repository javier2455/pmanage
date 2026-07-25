import { Skeleton } from "@/components/ui/skeleton";

/**
 * Filas de carga para las listas de "Ventas recientes" y "Gastos recientes".
 * Replica la rejilla `[1fr_auto]` de la fila real para que la tarjeta no salte
 * de alto cuando llegan los datos.
 */
export function RecentListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="grid grid-cols-[1fr_auto] items-start gap-3 border-b border-border py-2 last:border-0"
                >
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                </div>
            ))}
        </div>
    );
}
