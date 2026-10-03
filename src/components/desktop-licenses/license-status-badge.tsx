import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatDay,
  getLicenseStatus,
  type LicenseStatusKind,
} from "@/lib/desktop-licenses";
import type { DesktopInstallation } from "@/lib/types/desktop-licenses";

/** Solo los estados que merecen llamar la atención llevan badge. */
const STATUS_BADGE: Partial<
  Record<LicenseStatusKind, { label: string; className: string }>
> = {
  trial: {
    label: "Prueba",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  },
  expiring: {
    label: "Vence pronto",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  expired: {
    label: "Vencida",
    className: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
  },
};

export function LicenseStatusBadge({
  kind,
  className,
}: {
  kind: LicenseStatusKind;
  className?: string;
}) {
  const config = STATUS_BADGE[kind];
  if (!config) return null;
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

/** El mismo código apareció desde otro PC: posible copia de la instalación. */
export function DuplicateBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
        className,
      )}
    >
      <AlertTriangle />
      Posible duplicado
    </Badge>
  );
}

/**
 * Celda "Vence": fecha de la licencia con su aviso, o la prueba / la falta de
 * licencia cuando nunca se ha pagado.
 */
export function LicenseExpiry({
  installation,
}: {
  installation: Pick<DesktopInstallation, "expiresOn" | "trialStartedAt">;
}) {
  const status = getLicenseStatus(installation);

  if (status.kind === "none") {
    return <span className="text-sm text-muted-foreground">Sin licencia</span>;
  }

  if (status.kind === "trial") {
    return (
      <div className="flex flex-col items-start gap-1">
        <LicenseStatusBadge kind="trial" />
        <span className="text-xs text-muted-foreground">
          desde {formatDay(installation.trialStartedAt)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-sm tabular-nums text-foreground">
        {formatDay(installation.expiresOn)}
      </span>
      <LicenseStatusBadge kind={status.kind} />
    </div>
  );
}
