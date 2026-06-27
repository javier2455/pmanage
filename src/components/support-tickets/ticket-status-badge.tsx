import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SupportTicketStatus } from "@/lib/types/support-ticket";

const STATUS_CONFIG: Record<
  SupportTicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Abierto",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  },
  in_progress: {
    label: "En progreso",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  },
  closed: {
    label: "Cerrado",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
};

export function TicketStatusBadge({
  status,
  className,
}: {
  status: SupportTicketStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
