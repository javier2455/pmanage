// TODO BACKEND: ajustar este shape al payload real cuando el backend exponga endpoints.

export type WorkerRolePreset =
  | "dependiente"
  | "contador"
  | "almacenero"
  | "custom";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PermissionModule =
  | "sales"
  | "products"
  | "inventory"
  | "expenses"
  | "dailyClose"
  | "monthlyClose"
  | "analytics"
  | "exchangeRate";

export type WorkerPermissions = Record<
  PermissionModule,
  Partial<Record<PermissionAction, boolean>>
>;

export interface Worker {
  id: string;
  businessId: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  rolePreset: WorkerRolePreset;
  permissions: WorkerPermissions;
  createdAt: string;
}

export interface WorkersResponseInterface {
  data: Worker[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateWorkerInput {
  businessId: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  password: string | null;
  avatarFile: File | null;
  rolePreset: WorkerRolePreset;
  permissions: WorkerPermissions;
}

export type UpdateWorkerInput = CreateWorkerInput & { id: string };

export const PERMISSION_MODULES: PermissionModule[] = [
  "sales",
  "products",
  "inventory",
  "expenses",
  "dailyClose",
  "monthlyClose",
  "analytics",
  "exchangeRate",
];

export const PERMISSION_MODULE_LABELS: Record<PermissionModule, string> = {
  sales: "Ventas",
  products: "Productos",
  inventory: "Inventario",
  expenses: "Gastos",
  dailyClose: "Cierre diario",
  monthlyClose: "Cierre mensual",
  analytics: "Analítica",
  exchangeRate: "Tipo de cambio",
};

export const PERMISSION_MODULE_ACTIONS: Record<
  PermissionModule,
  PermissionAction[]
> = {
  sales: ["view", "create", "delete"],
  products: ["view", "create", "edit", "delete"],
  inventory: ["view", "create", "edit"],
  expenses: ["view", "create", "edit", "delete"],
  dailyClose: ["view", "create"],
  monthlyClose: ["view", "create"],
  analytics: ["view"],
  exchangeRate: ["view", "edit"],
};

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  view: "Ver",
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar",
};

export const ROLE_PRESET_LABELS: Record<WorkerRolePreset, string> = {
  dependiente: "Dependiente",
  contador: "Contador",
  almacenero: "Almacenero",
  custom: "Personalizado",
};

export function emptyPermissions(): WorkerPermissions {
  return PERMISSION_MODULES.reduce<WorkerPermissions>((acc, module) => {
    acc[module] = {};
    return acc;
  }, {} as WorkerPermissions);
}

export function clonePermissions(
  permissions: WorkerPermissions,
): WorkerPermissions {
  return PERMISSION_MODULES.reduce<WorkerPermissions>((acc, module) => {
    acc[module] = { ...(permissions[module] ?? {}) };
    return acc;
  }, {} as WorkerPermissions);
}

export function permissionsEqual(
  a: WorkerPermissions,
  b: WorkerPermissions,
): boolean {
  for (const module of PERMISSION_MODULES) {
    const actions = PERMISSION_MODULE_ACTIONS[module];
    for (const action of actions) {
      if (Boolean(a[module]?.[action]) !== Boolean(b[module]?.[action])) {
        return false;
      }
    }
  }
  return true;
}

export function countModulesWithAccess(permissions: WorkerPermissions): number {
  let count = 0;
  for (const module of PERMISSION_MODULES) {
    const actions = PERMISSION_MODULE_ACTIONS[module];
    if (actions.some((action) => permissions[module]?.[action])) count += 1;
  }
  return count;
}

export function listModulesWithAccess(
  permissions: WorkerPermissions,
): PermissionModule[] {
  return PERMISSION_MODULES.filter((module) => {
    const actions = PERMISSION_MODULE_ACTIONS[module];
    return actions.some((action) => permissions[module]?.[action]);
  });
}

export function isModuleEnabled(
  permissions: WorkerPermissions,
  module: PermissionModule,
): boolean {
  const actions = PERMISSION_MODULE_ACTIONS[module];
  return actions.some((action) => !!permissions[module]?.[action]);
}

export function setModuleEnabled(
  permissions: WorkerPermissions,
  module: PermissionModule,
  enabled: boolean,
): WorkerPermissions {
  const actions = PERMISSION_MODULE_ACTIONS[module];
  const next = clonePermissions(permissions);
  next[module] = actions.reduce<Partial<Record<PermissionAction, boolean>>>(
    (acc, action) => {
      acc[action] = enabled;
      return acc;
    },
    {},
  );
  return next;
}
