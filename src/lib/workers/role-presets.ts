import {
  emptyPermissions,
  type WorkerPermissions,
  type WorkerRolePreset,
} from "@/lib/types/worker";

// TODO BACKEND: estos presets son una guía visual provisional.
// El backend definirá los presets reales y/o devolverá los permisos por trabajador.
export const ROLE_PRESETS: Record<
  Exclude<WorkerRolePreset, "custom">,
  WorkerPermissions
> = {
  dependiente: {
    ...emptyPermissions(),
    sales: { view: true, create: true },
    products: { view: true },
  },
  contador: {
    ...emptyPermissions(),
    sales: { view: true },
    products: { view: true, create: true, edit: true },
    inventory: { view: true, create: true, edit: true },
    expenses: { view: true, create: true },
    dailyClose: { view: true, create: true },
    monthlyClose: { view: true, create: true },
    analytics: { view: true },
    exchangeRate: { view: true },
  },
  almacenero: {
    ...emptyPermissions(),
    products: { view: true },
    inventory: { view: true, create: true, edit: true },
  },
};

export function getPresetPermissions(
  preset: WorkerRolePreset,
): WorkerPermissions {
  if (preset === "custom") return emptyPermissions();
  return ROLE_PRESETS[preset];
}
