"use client";

import { useState } from "react";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { useGetAllTicketsQuery } from "@/hooks/use-support-ticket";
import { AdminTicketsTable } from "@/components/support-tickets/admin-tickets-table";
import type { SupportTicketStatus } from "@/lib/types/support-ticket";

const DEFAULT_LIMIT = 10;

export default function AdminSupportPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [status, setStatus] = useState<SupportTicketStatus | undefined>(
    undefined,
  );

  const { data, isLoading, isFetching, isError } = useGetAllTicketsQuery({
    page,
    limit,
    status,
  });

  const total = data?.meta?.total ?? 0;
  const tickets = data?.data ?? [];

  function handleStatusChange(next?: SupportTicketStatus) {
    setStatus(next);
    setPage(1);
  }

  function handleLimitChange(next: number) {
    setLimit(next);
    setPage(1);
  }

  if (isError) {
    return (
      <section>
        <p className="text-destructive">Error al cargar los tickets.</p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tickets de soporte
        </h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes de soporte de todos los usuarios
        </p>
        <div className="mt-4">
          {isLoading && !data ? (
            <SimpleTableSkeleton />
          ) : (
            <AdminTicketsTable
              tickets={tickets}
              total={total}
              page={page}
              limit={limit}
              status={status}
              isFetching={isFetching}
              onStatusChange={handleStatusChange}
              onPageChange={setPage}
              onLimitChange={handleLimitChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}
