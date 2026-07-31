"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useBusiness } from "@/context/business-context";
import { useAllWorkersByBusinessId } from "@/hooks/use-workers";
import {
  useAllInvitationsByBusinessId,
  useInvitationsCount,
} from "@/hooks/use-invitations";
import { useAnalyticsSalesByWorker } from "@/hooks/use-analytics";
import TableOfWorkers from "@/components/workers/table-of-workers";
import TableOfInvitations from "@/components/invitations/table-of-invitations";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import { SalesByWorkerTable } from "@/components/analytics/sales-by-worker-table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { currencyLabel } from "@/lib/currency";
import {
  resolvePresetRange,
  type DateRangePreset,
  type DateRangeValue,
} from "@/lib/date-range";

const DEFAULT_LIMIT = 5;
const VALID_TABS = ["workers", "invitations", "metrics"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isTabValue(value: string): value is TabValue {
  return (VALID_TABS as readonly string[]).includes(value);
}

export default function WorkersPage() {
  const { activeBusinessId } = useBusiness();
  const [activeTab, setActiveTab] = useState<TabValue>("workers");
  const [workersPage, setWorkersPage] = useState(1);
  const [workersLimit, setWorkersLimit] = useState(DEFAULT_LIMIT);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const [invitationsLimit, setInvitationsLimit] = useState(DEFAULT_LIMIT);
  // Por defecto, la semana en curso (lunes a domingo): es el período que el
  // usuario espera ver al entrar, y el rótulo del filtro dice cuál es.
  const [metricsPreset, setMetricsPreset] = useState<DateRangePreset>("week");
  const [metricsRange, setMetricsRange] = useState<DateRangeValue>(() =>
    resolvePresetRange("week"),
  );

  const businessId = activeBusinessId ?? "";

  const {
    data: workersData,
    isLoading: workersLoading,
    isFetching: workersFetching,
    isError: workersError,
  } = useAllWorkersByBusinessId(businessId, {
    page: workersPage,
    limit: workersLimit,
  });

  const {
    data: invitationsData,
    isLoading: invitationsLoading,
    isFetching: invitationsFetching,
    isError: invitationsError,
  } = useAllInvitationsByBusinessId(businessId, {
    page: invitationsPage,
    limit: invitationsLimit,
  });

  const { data: invitationsCount } = useInvitationsCount(businessId);

  const {
    data: salesByWorkerData,
    isLoading: salesByWorkerLoading,
    isFetching: salesByWorkerFetching,
    isError: salesByWorkerError,
  } = useAnalyticsSalesByWorker(businessId, {
    // Se mandan fechas explícitas en vez de `period` para que lo consultado sea
    // exactamente lo que el filtro muestra rotulado.
    startDate: metricsRange.startDate,
    endDate: metricsRange.endDate,
  });

  const handleTabChange = useCallback((next: string) => {
    if (isTabValue(next)) setActiveTab(next);
  }, []);

  const handleMetricsRangeChange = useCallback(
    (nextPreset: DateRangePreset, nextRange: DateRangeValue) => {
      setMetricsPreset(nextPreset);
      setMetricsRange(nextRange);
    },
    [],
  );

  const handleWorkersLimitChange = useCallback((nextLimit: number) => {
    setWorkersLimit(nextLimit);
    setWorkersPage(1);
  }, []);

  const handleInvitationsLimitChange = useCallback((nextLimit: number) => {
    setInvitationsLimit(nextLimit);
    setInvitationsPage(1);
  }, []);

  const showWorkersSkeleton = workersLoading && !workersData;
  const showInvitationsSkeleton = invitationsLoading && !invitationsData;
  const unconvertedCurrencies = salesByWorkerData?.unconvertedCurrencies ?? [];

  return (
    <section className="flex flex-col gap-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Trabajadores
        </h1>
        <p className="text-muted-foreground">
          Administra los trabajadores de tu negocio y sus permisos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* En móvil la lista se limita al ancho disponible y scrollea en
            horizontal (mismo patrón que los tabs de detalles de negocio): con
            `w-fit` los tres tabs se salían de la pantalla. */}
        <TabsList
          className="w-full max-w-full justify-start overflow-x-auto overflow-y-hidden sm:w-fit"
          data-tour="workers-tabs"
        >
          <TabsTrigger
            value="workers"
            className="cursor-pointer"
            data-tour="workers-tab-workers"
          >
            Trabajadores
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="cursor-pointer"
            data-tour="workers-tab-invitations"
          >
            Invitaciones
            {invitationsCount && invitationsCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              >
                {invitationsCount}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger
            value="metrics"
            className="cursor-pointer"
            data-tour="workers-tab-metrics"
          >
            {/* Etiqueta corta en móvil: el nombre completo hacía que los tres
                tabs no cupieran en pantalla. */}
            <span className="sm:hidden">Desempeño</span>
            <span className="hidden sm:inline">Desempeño de ventas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workers">
          {workersError ? (
            <div className="text-sm text-destructive">
              Error al cargar los trabajadores
            </div>
          ) : showWorkersSkeleton ? (
            <SimpleTableSkeleton />
          ) : (
            <TableOfWorkers
              workers={workersData?.data ?? []}
              meta={
                workersData?.meta ?? {
                  total: 0,
                  page: workersPage,
                  limit: workersLimit,
                  totalPages: 0,
                }
              }
              isFetching={workersFetching}
              onPageChange={setWorkersPage}
              onLimitChange={handleWorkersLimitChange}
            />
          )}
        </TabsContent>

        <TabsContent value="invitations">
          {invitationsError ? (
            <div className="text-sm text-destructive">
              Error al cargar las invitaciones
            </div>
          ) : showInvitationsSkeleton ? (
            <SimpleTableSkeleton />
          ) : (
            <TableOfInvitations
              invitations={invitationsData?.data ?? []}
              meta={
                invitationsData?.meta ?? {
                  total: 0,
                  page: invitationsPage,
                  limit: invitationsLimit,
                  totalPages: 0,
                }
              }
              isFetching={invitationsFetching}
              onPageChange={setInvitationsPage}
              onLimitChange={handleInvitationsLimitChange}
            />
          )}
        </TabsContent>

        <TabsContent value="metrics" className="flex flex-col gap-4 ">
          <div className="mt-4 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Desempeño de ventas de cada trabajador en el período
              seleccionado.
            </p>
            <DateRangeFilter
              preset={metricsPreset}
              range={metricsRange}
              onChange={handleMetricsRangeChange}
              effectiveRange={salesByWorkerData?.period}
            />
          </div>

          {unconvertedCurrencies.length > 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Hay ventas en{" "}
                {unconvertedCurrencies.map(currencyLabel).join(", ")} sin tipo de
                cambio configurado, así que no entran en las ventas totales.
                Configúralo en{" "}
                <Link
                  href="/dashboard/exchange-rate"
                  className="underline-offset-2 hover:underline"
                >
                  Tipo de cambio
                </Link>
                .
              </span>
            </div>
          ) : null}

          {salesByWorkerError ? (
            <div className="text-sm text-destructive">
              Error al cargar el desempeño de ventas
            </div>
          ) : (
            <SalesByWorkerTable
              data={salesByWorkerData?.data ?? []}
              isLoading={salesByWorkerLoading && !salesByWorkerData}
              isFetching={salesByWorkerFetching}
            />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
