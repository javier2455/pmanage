import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TimelineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-0">
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <Skeleton className="h-9 w-40" />
        </div>

        <div className="px-4 pb-2">
          <div className="relative ml-4 border-l border-border pt-2">
            <Skeleton className="mb-3 ml-10 h-5 w-40" />
            <ul className="list-none">
              {Array.from({ length: count }).map((_, i) => (
                <li key={i} className="relative pl-10 pb-8">
                  <span
                    aria-hidden="true"
                    className="absolute -left-1.75 top-2 h-3.5 w-3.5 rounded-full bg-muted ring-4 ring-muted/40"
                  />
                  <div className="flex flex-col-reverse items-stretch overflow-hidden rounded-lg border border-border bg-card sm:flex-row">
                    <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                      <Skeleton className="h-4 w-40" />
                      <div className="mt-1 flex flex-wrap gap-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="mt-1 h-3 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-40 w-full shrink-0 rounded-none sm:h-auto sm:w-36 md:w-44" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-9 w-64" />
        </div>
      </CardContent>
    </Card>
  );
}
