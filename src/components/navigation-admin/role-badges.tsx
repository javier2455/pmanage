"use client";

import { cn } from "@/lib/utils";
import { AdminBadge } from "@/components/ui/admin-badge";
import { Badge } from "@/components/ui/badge";

import { getRoleLabel, isAdminOnly } from "./role-multiselect";

interface RoleBadgesProps {
  roles: string[] | null | undefined;
  className?: string;
}

/**
 * Renderiza los chips de roles para un nodo del árbol.
 *
 * - Si el nodo es **solo admin** (roles === ["5"]), muestra un único badge
 *   "Administrador" con gradiente morado con iluminación (destacado).
 * - En cualquier otro caso, muestra un chip neutro por cada rol.
 */
export function RoleBadges({ roles, className }: RoleBadgesProps) {
  if (!roles || roles.length === 0) return null;

  if (isAdminOnly(roles)) {
    return <AdminBadge className={className} />;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {roles.map((id) => (
        <Badge key={id} variant="secondary" className="text-[10px] font-normal">
          {getRoleLabel(id)}
        </Badge>
      ))}
    </div>
  );
}

// AdminBadge se movió a @/components/ui/admin-badge para reutilizarlo
// fuera de navigation-admin (futuras features "enterprise-like").
export { AdminBadge } from "@/components/ui/admin-badge";
