"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetDesktopInstallationsQuery } from "@/hooks/use-desktop-licenses";
import { InstallationsTable } from "@/components/desktop-licenses/installations-table";
import { CreateInstallationDialog } from "@/components/desktop-licenses/create-installation-dialog";
import { PaymentContactsCard } from "@/components/desktop-licenses/payment-contacts-card";

const SEARCH_DEBOUNCE_MS = 350;
const DEFAULT_LIMIT = 10;

export default function DesktopLicensesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);

  /**
   * Vuelve a la primera página cuando cambia la búsqueda (ya debounced) o el
   * tamaño de página. Se ajusta durante el render, igual que en Asignar Planes.
   */
  const pageResetKey = `${debouncedSearch}|${limit}`;
  const [lastPageResetKey, setLastPageResetKey] = useState(pageResetKey);
  if (lastPageResetKey !== pageResetKey) {
    setLastPageResetKey(pageResetKey);
    setPage(1);
  }

  const { data, isLoading, isFetching, isError } =
    useGetDesktopInstallationsQuery({
      search: debouncedSearch || undefined,
      page,
      limit,
    });

  return (
    <section className="flex min-w-0 max-w-full flex-col gap-6 overflow-x-hidden p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Licencias de escritorio
          </h1>
          <p className="text-muted-foreground">
            Instalaciones de Negora para Windows: pagos, vencimientos y códigos
            de renovación
          </p>
        </div>
        <CreateInstallationDialog
          trigger={
            <Button>
              <Plus className="mr-2 size-4" />
              Alta manual
            </Button>
          }
        />
      </div>

      <PaymentContactsCard />

      {isError ? (
        <p className="text-destructive">Error al cargar las instalaciones.</p>
      ) : (
        <InstallationsTable
          installations={data?.data ?? []}
          isLoading={isLoading}
          isFetching={isFetching && !isLoading}
          total={data?.meta?.total ?? 0}
          totalPages={data?.meta?.totalPages ?? 0}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
        />
      )}
    </section>
  );
}
