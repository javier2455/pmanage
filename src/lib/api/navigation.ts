import apiClient from "@/lib/axios";
import { navigationRoutes } from "../routes/navigation";
import {
  AdminMenu,
  AdminMenuWithSubmenus,
  CreateAdminMenuProps,
  CreateSectionProps,
  CreateSubmenuProps,
  GetAllAdminMenusResponse,
  GetAllSectionsResponse,
  GetAllSubmenusResponse,
  GetSectionListResponse,
  ReorderMenusProps,
  ReorderSectionsProps,
  ReorderSubmenusProps,
  Section,
  SectionApiNode,
  Submenu,
  UpdateAdminMenuProps,
  UpdateSectionProps,
  UpdateSubmenuProps,
} from "../types/navigation";

interface ListResponse<T> {
  message?: string;
  data: T[];
}

interface SingleResponse<T> {
  message?: string;
  data: T;
}

/**
 * El backend a veces devuelve `{ data: [...] }` y a veces el array crudo
 * (como en GET /menu/). Aceptamos ambos para que el contrato sea robusto.
 */
function unwrapList<T>(payload: T[] | ListResponse<T>): T[] {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? [];
}

// ===== Sections =====

export interface GetAllSectionsParams {
  businessId?: string;
}

export async function getAllSections(
  params: GetAllSectionsParams = {},
): Promise<GetAllSectionsResponse> {
  const { data } = await apiClient.get<
    SectionApiNode[] | ListResponse<SectionApiNode>
  >(navigationRoutes.getAllSections, {
    params: params.businessId ? { businessId: params.businessId } : undefined,
  });
  return unwrapList(data);
}

/**
 * Variante plana: GET /section?isList=true devuelve la jerarquía aplanada
 * con permisos por nodo. Útil para validaciones de permisos en páginas
 * específicas (mismo patrón que getMenuList).
 */
export async function getSectionList(
  params: GetAllSectionsParams = {},
): Promise<GetSectionListResponse> {
  const { data } = await apiClient.get<
    GetSectionListResponse | ListResponse<GetSectionListResponse[number]>
  >(navigationRoutes.getAllSections, {
    params: {
      isList: true,
      ...(params.businessId ? { businessId: params.businessId } : {}),
    },
  });
  return unwrapList(data);
}

export async function getSectionById(
  id: string,
): Promise<SectionApiNode> {
  const { data } = await apiClient.get<
    SectionApiNode | SingleResponse<SectionApiNode>
  >(navigationRoutes.getSectionById(id));
  if (data && typeof data === "object" && "data" in data) {
    return (data as SingleResponse<SectionApiNode>).data;
  }
  return data as SectionApiNode;
}

export async function createSection(
  credentials: CreateSectionProps,
): Promise<Section> {
  const { data } = await apiClient.post<SingleResponse<Section>>(
    navigationRoutes.createSection,
    credentials,
  );
  return data.data;
}

export async function updateSection(
  id: string,
  credentials: UpdateSectionProps,
): Promise<Section> {
  const { data } = await apiClient.patch<SingleResponse<Section>>(
    navigationRoutes.updateSection(id),
    credentials,
  );
  return data.data;
}

export async function deleteSection(id: string) {
  const { data } = await apiClient.delete(navigationRoutes.deleteSection(id));
  return data;
}

export async function reorderSections(
  credentials: ReorderSectionsProps,
): Promise<void> {
  await apiClient.patch(navigationRoutes.reorderSections, credentials);
}

// ===== Admin Menus =====

export async function getAllAdminMenus(): Promise<GetAllAdminMenusResponse> {
  const { data } = await apiClient.get<ListResponse<AdminMenuWithSubmenus>>(
    navigationRoutes.getAllAdminMenus,
  );
  return data.data ?? [];
}

export async function getAdminMenuById(
  id: string,
): Promise<AdminMenuWithSubmenus> {
  const { data } = await apiClient.get<SingleResponse<AdminMenuWithSubmenus>>(
    navigationRoutes.getAdminMenuById(id),
  );
  return data.data;
}

export async function createAdminMenu(
  credentials: CreateAdminMenuProps,
): Promise<AdminMenu> {
  const { data } = await apiClient.post<SingleResponse<AdminMenu>>(
    navigationRoutes.createAdminMenu,
    credentials,
  );
  return data.data;
}

export async function updateAdminMenu(
  id: string,
  credentials: UpdateAdminMenuProps,
): Promise<AdminMenu> {
  const { data } = await apiClient.patch<SingleResponse<AdminMenu>>(
    navigationRoutes.updateAdminMenu(id),
    credentials,
  );
  return data.data;
}

export async function deleteAdminMenu(id: string) {
  const { data } = await apiClient.delete(
    navigationRoutes.deleteAdminMenu(id),
  );
  return data;
}

export async function reorderAdminMenus(
  credentials: ReorderMenusProps,
): Promise<void> {
  await apiClient.patch(navigationRoutes.reorderAdminMenus, credentials);
}

// ===== Submenus =====

export async function getAllSubmenus(): Promise<GetAllSubmenusResponse> {
  const { data } = await apiClient.get<ListResponse<Submenu>>(
    navigationRoutes.getAllSubmenus,
  );
  return data.data ?? [];
}

export async function getSubmenuById(id: string): Promise<Submenu> {
  const { data } = await apiClient.get<SingleResponse<Submenu>>(
    navigationRoutes.getSubmenuById(id),
  );
  return data.data;
}

export async function getSubmenusByMenu(menuId: string): Promise<Submenu[]> {
  const { data } = await apiClient.get<ListResponse<Submenu>>(
    navigationRoutes.getSubmenusByMenu(menuId),
  );
  return data.data ?? [];
}

export async function createSubmenu(
  credentials: CreateSubmenuProps,
): Promise<Submenu> {
  const { data } = await apiClient.post<SingleResponse<Submenu>>(
    navigationRoutes.createSubmenu,
    credentials,
  );
  return data.data;
}

export async function updateSubmenu(
  id: string,
  credentials: UpdateSubmenuProps,
): Promise<Submenu> {
  const { data } = await apiClient.patch<SingleResponse<Submenu>>(
    navigationRoutes.updateSubmenu(id),
    credentials,
  );
  return data.data;
}

export async function deleteSubmenu(id: string) {
  const { data } = await apiClient.delete(navigationRoutes.deleteSubmenu(id));
  return data;
}

export async function reorderSubmenus(
  credentials: ReorderSubmenusProps,
): Promise<void> {
  await apiClient.patch(navigationRoutes.reorderSubmenus, credentials);
}
