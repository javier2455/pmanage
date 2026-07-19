import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAdminMenu,
  createSection,
  createSubmenu,
  deleteAdminMenu,
  deleteSection,
  deleteSubmenu,
  getAdminMenuById,
  getAllAdminMenus,
  getAllSections,
  getAllSubmenus,
  getSectionById,
  getSectionList,
  getSubmenuById,
  getSubmenusByMenu,
  reorderAdminMenus,
  reorderNavigationTree,
  reorderSections,
  reorderSubmenus,
  updateAdminMenu,
  updateSection,
  updateSubmenu,
} from "@/lib/api/navigation";
import {
  CreateAdminMenuProps,
  CreateSectionProps,
  CreateSubmenuProps,
  ReorderMenusProps,
  ReorderSectionsProps,
  ReorderSubmenusProps,
  ReorderTreeProps,
  SectionApiNode,
  UpdateAdminMenuProps,
  UpdateSectionProps,
  UpdateSubmenuProps,
} from "@/lib/types/navigation";

const NAV_BASE_KEY = "navigation" as const;
const SECTIONS_KEY = [NAV_BASE_KEY, "sections"] as const;
const SECTION_LIST_KEY = [NAV_BASE_KEY, "section-list"] as const;

/**
 * Reordena `items` para que aparezcan en el orden de `orderedIds`. Los ítems
 * que no estén en `orderedIds` (caso defensivo) se conservan al final en su
 * orden original. No muta la lista de entrada.
 */
export function applyOrder<T>(
  items: T[],
  orderedIds: string[],
  getId: (item: T) => string,
): T[] {
  const byId = new Map(items.map((item) => [getId(item), item]));
  const ordered: T[] = [];
  for (const id of orderedIds) {
    const item = byId.get(id);
    if (item) {
      ordered.push(item);
      byId.delete(id);
    }
  }
  for (const item of items) {
    if (byId.has(getId(item))) ordered.push(item);
  }
  return ordered;
}

/**
 * Tras cualquier mutación administrativa invalidamos el árbol completo
 * y el queryKey que alimenta el sidebar runtime para que se refresque.
 */
function useInvalidateNavigation() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [NAV_BASE_KEY] });
    queryClient.invalidateQueries({ queryKey: ["all-menu-items"] });
    queryClient.invalidateQueries({ queryKey: ["menu-list-flat"] });
  };
}

// ===== SECTIONS =====

interface UseGetAllSectionsParams {
  businessId?: string;
  enabled?: boolean;
}

export function useGetAllSectionsQuery({
  businessId,
  enabled = true,
}: UseGetAllSectionsParams = {}) {
  return useQuery({
    queryKey: [...SECTIONS_KEY, businessId ?? null],
    queryFn: () => getAllSections({ businessId }),
    enabled,
  });
}

export function useGetSectionListQuery({
  businessId,
  enabled = true,
}: UseGetAllSectionsParams = {}) {
  return useQuery({
    queryKey: [...SECTION_LIST_KEY, businessId ?? null],
    queryFn: () => getSectionList({ businessId }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetSectionByIdQuery(id: string) {
  return useQuery({
    queryKey: [NAV_BASE_KEY, "section", id],
    queryFn: () => getSectionById(id),
    enabled: !!id,
  });
}

export function useCreateSectionMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (credentials: CreateSectionProps) => createSection(credentials),
    onSuccess: invalidate,
  });
}

export function useUpdateSectionMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: ({
      id,
      credentials,
    }: {
      id: string;
      credentials: UpdateSectionProps;
    }) => updateSection(id, credentials),
    onSuccess: invalidate,
  });
}

export function useDeleteSectionMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (id: string) => deleteSection(id),
    onSuccess: invalidate,
  });
}

/**
 * Reordena las secciones. Aplica una actualización optimista sobre todos los
 * árboles cacheados (`["navigation","sections", *]`) para que el arrastre se
 * sienta instantáneo, y revierte si el backend falla.
 */
export function useReorderSectionsMutation() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (credentials: ReorderSectionsProps) =>
      reorderSections(credentials),
    onMutate: async ({ orderedIds }) => {
      await queryClient.cancelQueries({ queryKey: SECTIONS_KEY });
      const previous = queryClient.getQueriesData<SectionApiNode[]>({
        queryKey: SECTIONS_KEY,
      });
      queryClient.setQueriesData<SectionApiNode[]>(
        { queryKey: SECTIONS_KEY },
        (old) =>
          old
            ? applyOrder(old, orderedIds, (s) => s.id).map((s, i) => ({
                ...s,
                order: i + 1,
              }))
            : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: invalidate,
  });
}

/**
 * Persiste TODO el árbol reordenado en una sola llamada atómica. Se usa en el
 * flujo por lotes: el usuario acumula movimientos en un borrador local y al
 * pulsar "Guardar cambios" se envía el árbol completo. En éxito invalida para
 * resincronizar con el servidor; en error, la página conserva el borrador.
 */
export function useReorderNavigationTreeMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (payload: ReorderTreeProps) => reorderNavigationTree(payload),
    onSuccess: invalidate,
  });
}

// ===== ADMIN MENUS =====

export function useGetAllAdminMenusQuery(enabled = true) {
  return useQuery({
    queryKey: [NAV_BASE_KEY, "admin-menus"],
    queryFn: getAllAdminMenus,
    enabled,
  });
}

export function useGetAdminMenuByIdQuery(id: string) {
  return useQuery({
    queryKey: [NAV_BASE_KEY, "admin-menu", id],
    queryFn: () => getAdminMenuById(id),
    enabled: !!id,
  });
}

export function useCreateAdminMenuMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (credentials: CreateAdminMenuProps) =>
      createAdminMenu(credentials),
    onSuccess: invalidate,
  });
}

export function useUpdateAdminMenuMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: ({
      id,
      credentials,
    }: {
      id: string;
      credentials: UpdateAdminMenuProps;
    }) => updateAdminMenu(id, credentials),
    onSuccess: invalidate,
  });
}

export function useDeleteAdminMenuMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (id: string) => deleteAdminMenu(id),
    onSuccess: invalidate,
  });
}

/**
 * Reordena los menús dentro de una sección con actualización optimista sobre
 * el árbol cacheado.
 */
export function useReorderAdminMenusMutation() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (credentials: ReorderMenusProps) =>
      reorderAdminMenus(credentials),
    onMutate: async ({ sectionId, orderedIds }) => {
      await queryClient.cancelQueries({ queryKey: SECTIONS_KEY });
      const previous = queryClient.getQueriesData<SectionApiNode[]>({
        queryKey: SECTIONS_KEY,
      });
      queryClient.setQueriesData<SectionApiNode[]>(
        { queryKey: SECTIONS_KEY },
        (old) =>
          old
            ? old.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      menus: applyOrder(
                        section.menus ?? [],
                        orderedIds,
                        (m) => m.id,
                      ).map((m, i) => ({ ...m, order: i + 1 })),
                    }
                  : section,
              )
            : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: invalidate,
  });
}

// ===== SUBMENUS =====

export function useGetAllSubmenusQuery(enabled = true) {
  return useQuery({
    queryKey: [NAV_BASE_KEY, "submenus"],
    queryFn: getAllSubmenus,
    enabled,
  });
}

export function useGetSubmenuByIdQuery(id: string) {
  return useQuery({
    queryKey: [NAV_BASE_KEY, "submenu", id],
    queryFn: () => getSubmenuById(id),
    enabled: !!id,
  });
}

export function useGetSubmenusByMenuQuery(menuId: string) {
  return useQuery({
    queryKey: [NAV_BASE_KEY, "submenus-by-menu", menuId],
    queryFn: () => getSubmenusByMenu(menuId),
    enabled: !!menuId,
  });
}

export function useCreateSubmenuMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (credentials: CreateSubmenuProps) => createSubmenu(credentials),
    onSuccess: invalidate,
  });
}

export function useUpdateSubmenuMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: ({
      id,
      credentials,
    }: {
      id: string;
      credentials: UpdateSubmenuProps;
    }) => updateSubmenu(id, credentials),
    onSuccess: invalidate,
  });
}

export function useDeleteSubmenuMutation() {
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (id: string) => deleteSubmenu(id),
    onSuccess: invalidate,
  });
}

/**
 * Reordena los submenús dentro de un menú con actualización optimista sobre
 * el árbol cacheado.
 */
export function useReorderSubmenusMutation() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateNavigation();
  return useMutation({
    mutationFn: (credentials: ReorderSubmenusProps) =>
      reorderSubmenus(credentials),
    onMutate: async ({ menuId, orderedIds }) => {
      await queryClient.cancelQueries({ queryKey: SECTIONS_KEY });
      const previous = queryClient.getQueriesData<SectionApiNode[]>({
        queryKey: SECTIONS_KEY,
      });
      queryClient.setQueriesData<SectionApiNode[]>(
        { queryKey: SECTIONS_KEY },
        (old) =>
          old
            ? old.map((section) => ({
                ...section,
                menus: (section.menus ?? []).map((menu) =>
                  menu.id === menuId
                    ? {
                        ...menu,
                        submenus: applyOrder(
                          menu.submenus ?? [],
                          orderedIds,
                          (s) => s.id,
                        ).map((s, i) => ({ ...s, order: i + 1 })),
                      }
                    : menu,
                ),
              }))
            : old,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      );
    },
    onSettled: invalidate,
  });
}
