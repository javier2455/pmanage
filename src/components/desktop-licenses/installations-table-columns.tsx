"use client";

import type { ColumnMeta } from "@/components/data-table/column-meta";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTimeShort, formatRelativeTime } from "@/lib/dates";
import { formatInstallationCode } from "@/lib/desktop-licenses";
import { DASH } from "@/lib/utils";
import type { DesktopInstallation } from "@/lib/types/desktop-licenses";
import { DuplicateBadge, LicenseExpiry } from "./license-status-badge";

const compactColumnMeta = {
  headerClassName: "w-[1%] whitespace-nowrap",
  cellClassName: "w-[1%] whitespace-nowrap align-top",
} satisfies ColumnMeta;

export function installationDetailHref(code: string) {
  return `/dashboard/admin/desktop-licenses/details?code=${encodeURIComponent(code)}`;
}

export function createInstallationsColumns(): ColumnDef<DesktopInstallation>[] {
  return [
    {
      id: "code",
      meta: compactColumnMeta,
      header: () => <span className="font-medium">Código</span>,
      cell: ({ row }) => (
        <Link
          href={installationDetailHref(row.original.installationCode)}
          className="font-mono text-sm text-foreground hover:underline"
        >
          {formatInstallationCode(row.original.installationCode)}
        </Link>
      ),
    },
    {
      id: "business",
      meta: {
        headerClassName: "min-w-[180px]",
        cellClassName: "min-w-[180px] align-top",
      } satisfies ColumnMeta,
      header: () => <span className="font-medium">Negocio</span>,
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium text-foreground">
            {row.original.businessName}
          </span>
          {row.original.duplicateSuspected ? <DuplicateBadge /> : null}
        </div>
      ),
    },
    {
      id: "owner",
      meta: {
        headerClassName: "min-w-[180px]",
        cellClassName: "min-w-[180px] align-top",
      } satisfies ColumnMeta,
      header: () => <span className="font-medium">Dueño</span>,
      cell: ({ row }) => {
        const { ownerName, ownerEmail, ownerPhone } = row.original;
        const contact = [ownerEmail, ownerPhone].filter(Boolean).join(" · ");
        if (!ownerName && !contact) {
          return <span className="text-muted-foreground">{DASH}</span>;
        }
        return (
          <div className="flex flex-col">
            {ownerName ? (
              <span className="text-foreground">{ownerName}</span>
            ) : null}
            {contact ? (
              <span className="text-xs text-muted-foreground">{contact}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "version",
      meta: compactColumnMeta,
      header: () => <span className="font-medium">Versión</span>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.appVersion || DASH}
        </span>
      ),
    },
    {
      id: "lastSeen",
      meta: compactColumnMeta,
      header: () => <span className="font-medium">Última conexión</span>,
      cell: ({ row }) => {
        const { lastSeenAt } = row.original;
        if (!lastSeenAt) {
          return <span className="text-sm text-muted-foreground">Nunca</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm text-foreground">
              {formatRelativeTime(lastSeenAt)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTimeShort(lastSeenAt)}
            </span>
          </div>
        );
      },
    },
    {
      id: "expires",
      meta: compactColumnMeta,
      header: () => <span className="font-medium">Vence</span>,
      cell: ({ row }) => <LicenseExpiry installation={row.original} />,
    },
    {
      id: "actions",
      meta: {
        headerClassName: "w-[1%] whitespace-nowrap text-right",
        cellClassName: "w-[1%] whitespace-nowrap align-top",
      } satisfies ColumnMeta,
      header: () => (
        <div className="text-right font-medium text-foreground">Acciones</div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link href={installationDetailHref(row.original.installationCode)}>
              <KeyRound className="size-4" />
              Gestionar
            </Link>
          </Button>
        </div>
      ),
    },
  ];
}
