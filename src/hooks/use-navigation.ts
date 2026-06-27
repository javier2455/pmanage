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
  updateAdminMenu,
  updateSection,
  updateSubmenu,
} from "@/lib/api/navigation";
import {
  CreateAdminMenuProps,
  CreateSectionProps,
  CreateSubmenuProps,
  UpdateAdminMenuProps,
  UpdateSectionProps,
  UpdateSubmenuProps,
} from "@/lib/types/navigation";

const NAV_BASE_KEY = "navigation" as const;
const SECTIONS_KEY = [NAV_BASE_KEY, "sections"] as const;
const SECTION_LIST_KEY = [NAV_BASE_KEY, "section-list"] as const;

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
