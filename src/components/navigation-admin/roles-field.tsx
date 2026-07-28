"use client";

import { ShieldCheck } from "lucide-react";

import { Label } from "@/components/ui/label";
import { ADMIN_ROLE_ID } from "@/lib/admin-access";

import { RoleMultiSelect } from "./role-multiselect";

interface RolesFieldProps {
  value: string[];
  onChange: (roles: string[]) => void;
  /**
   * El nodo queda amarrado al rol administrador porque cuelga de un padre
   * solo-admin o porque su URL pertenece al panel `/admin`. Cuando es `true`
   * el selector se bloquea en `[admin]` y se explica por qué.
   */
  lockedToAdmin: boolean;
  /** Texto que explica de dónde viene el bloqueo (padre o ruta). */
  lockReason?: string;
  error?: string;
}

/**
 * Campo "Roles con acceso" de los formularios de sección/menú/submenú.
 *
 * Existe para que la restricción de Administración no dependa de que quien
 * crea el módulo se acuerde de marcar el rol: si el nodo cuelga de un padre
 * solo-admin o apunta a una ruta `/admin`, el campo se fija en
 * "Administrador" y no se puede abrir a otros roles desde la UI.
 */
export function RolesField({
  value,
  onChange,
  lockedToAdmin,
  lockReason,
  error,
}: RolesFieldProps) {
  const effectiveValue = lockedToAdmin ? [ADMIN_ROLE_ID] : value;

  return (
    <div className="flex flex-col gap-2">
      <Label>
        Roles con acceso{" "}
        <span className="text-xs text-muted-foreground">
          {lockedToAdmin ? "(fijado)" : "(opcional)"}
        </span>
      </Label>

      <RoleMultiSelect
        value={effectiveValue}
        onChange={onChange}
        disabled={lockedToAdmin}
        invalid={!!error}
      />

      {lockedToAdmin && (
        <p className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            {lockReason ??
              "Este elemento pertenece a Administración, así que solo puede verlo el rol administrador."}{" "}
            No se puede asignar como permiso a dueños de negocio ni a
            trabajadores.
          </span>
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
