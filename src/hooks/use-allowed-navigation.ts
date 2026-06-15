"use client";

import { useMemo } from "react";
import { useGetAllSectionsQuery } from "@/hooks/use-navigation";
import { useUserRoleAndPlan } from "@/hooks/use-user-role-plan";
import { useBusiness } from "@/context/business-context";
import { collectAllowedUrls } from "@/lib/navigation-access";

export interface AllowedNavigation {
  /** URLs navegables (menús y submenús) a las que el usuario tiene acceso. */
  allowedUrls: string[];
  /**
   * `true` cuando el negocio activo es un negocio donde el usuario es
   * trabajador: solo en ese caso aplicamos el control de acceso por
   * secciones. Para dueños/admin el árbol ya representa todo lo suyo.
   */
  enforce: boolean;
  /**
   * `true` cuando ya tenemos la información suficiente para decidir (negocios
   * resueltos y, si aplica enforce, secciones cargadas). Mientras sea `false`
   * el guard debe esperar en vez de redirigir.
   */
  isResolved: boolean;
}

/**
 * Deriva las rutas permitidas a partir del árbol de secciones que entrega el
 * backend (ya filtrado por `businessId` para trabajadores). Es la fuente de
 * verdad tanto para el sidebar como para el guard de acceso.
 */
export function useAllowedNavigation(): AllowedNavigation {
  const { roleId } = useUserRoleAndPlan();
  const {
    activeBusiness,
    businesses,
    isLoading: isLoadingBusinesses,
  } = useBusiness();

  const businessIdForMenu = activeBusiness?.isWorker
    ? activeBusiness.id
    : undefined;

  const businessResolved =
    !isLoadingBusinesses && (businesses.length === 0 || !!activeBusiness);

  /* Igual que el sidebar: esperamos a que el negocio activo esté resuelto
     para que la única petición ya incluya el businessId y el backend
     devuelva los permisos correctos del trabajador. */
  const { data: sections, isLoading: isLoadingSections } =
    useGetAllSectionsQuery({
      businessId: businessIdForMenu,
      enabled: businessResolved,
    });

  const enforce = activeBusiness?.isWorker === true;

  const allowedUrls = useMemo<string[]>(
    () => collectAllowedUrls(sections, roleId),
    [sections, roleId],
  );

  const sectionsReady = !isLoadingSections && !!sections;
  const isResolved = businessResolved && (!enforce || sectionsReady);

  return { allowedUrls, enforce, isResolved };
}
