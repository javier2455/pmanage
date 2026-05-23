"use client";

import { useCallback, useState } from "react";
import { useBusiness } from "@/context/business-context";
import { useAllWorkersByBusinessId } from "@/hooks/use-workers";
import {
  useAllInvitationsByBusinessId,
  useInvitationsCount,
} from "@/hooks/use-invitations";
import TableOfWorkers from "@/components/workers/table-of-workers";
import TableOfInvitations from "@/components/invitations/table-of-invitations";
import { SimpleTableSkeleton } from "@/components/generic/simple-table-skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const DEFAULT_LIMIT = 5;
const VALID_TABS = ["workers", "invitations"] as const;
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

  const handleTabChange = useCallback((next: string) => {
    if (isTabValue(next)) setActiveTab(next);
  }, []);

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
        <TabsList>
          <TabsTrigger value="workers" className="cursor-pointer">
            Trabajadores
          </TabsTrigger>
          <TabsTrigger value="invitations" className="cursor-pointer">
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
      </Tabs>
    </section>
  );
}
