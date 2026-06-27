import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminBadgeProps {
  className?: string;
  /** Texto del badge. Default: "Administrador". */
  label?: string;
}

/**
 * Badge destacado con gradiente morado (violet → purple → fuchsia) y glow.
 * Pensado para marcar elementos exclusivos de administradores o features
 * "enterprise-like" donde se quiera resaltar el acceso restringido.
 *
 * Ejemplo:
 * ```tsx
 * <AdminBadge />                              // "Administrador"
 * <AdminBadge label="Enterprise" />
 * <AdminBadge className="ml-auto" />
 * ```
 */
export function AdminBadge({
  className,
  label = "Administrador",
}: AdminBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-violet-300/50 bg-linear-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md shadow-violet-500/40",
        className,
      )}
    >
      <Sparkles className="size-2.5" />
      {label}
    </span>
  );
}
