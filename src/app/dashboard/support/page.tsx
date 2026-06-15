"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { useGetMyTicketsQuery } from "@/hooks/use-support-ticket";
import { CreateTicketDialog } from "@/components/support-tickets/create-ticket-dialog";
import { MyTicketsTable } from "@/components/support-tickets/my-tickets-table";

const DEFAULT_LIMIT = 10;

export default function SupportPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const { data, isLoading, isFetching, isError } = useGetMyTicketsQuery({
    page,
    limit,
  });

  const total = data?.meta?.total ?? 0;
  const tickets = data?.data ?? [];

  function handleLimitChange(next: number) {
    setLimit(next);
    setPage(1);
  }

  if (isError) {
    return (
      <section>
        <p className="text-destructive">Error al cargar tus tickets.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Soporte
        </h1>
        <p className="text-muted-foreground">
          Reporta problemas o consultas y haz seguimiento a tus tickets
        </p>
        <div className="mb-4 mt-4 flex items-center justify-end">
          <CreateTicketDialog
            trigger={
              <Button>
                <Plus data-icon="inline-start" />
                Nuevo ticket
              </Button>
            }
          />
        </div>

        {isLoading && !data ? (
          <SimpleTableSkeleton />
        ) : (
          <MyTicketsTable
            tickets={tickets}
            total={total}
            page={page}
            limit={limit}
            isFetching={isFetching}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>
    </section>
  );
}
