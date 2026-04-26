"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PERMISSION_MODULES,
  PERMISSION_MODULE_LABELS,
  ROLE_PRESET_LABELS,
  isModuleEnabled,
  permissionsEqual,
  setModuleEnabled,
  type PermissionModule,
  type WorkerPermissions,
  type WorkerRolePreset,
} from "@/lib/types/worker";
import { getPresetPermissions } from "@/lib/workers/role-presets";

interface WorkerPermissionsSectionProps {
  rolePreset: WorkerRolePreset;
  permissions: WorkerPermissions;
  onRolePresetChange: (
    next: WorkerRolePreset,
    nextPermissions: WorkerPermissions,
  ) => void;
  onPermissionsChange: (
    nextPermissions: WorkerPermissions,
    nextRolePreset: WorkerRolePreset,
  ) => void;
}

const ROLE_OPTIONS: WorkerRolePreset[] = [
  "dependiente",
  "contador",
  "almacenero",
  "custom",
];

const CHECKBOX_CLASS =
  "size-5 border-2 border-muted-foreground/50 bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground dark:bg-muted dark:border-muted-foreground/60 dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary";

function deriveRolePreset(permissions: WorkerPermissions): WorkerRolePreset {
  for (const preset of ["dependiente", "contador", "almacenero"] as const) {
    if (permissionsEqual(permissions, getPresetPermissions(preset))) {
      return preset;
    }
  }
  return "custom";
}

export function WorkerPermissionsSection({
  rolePreset,
  permissions,
  onRolePresetChange,
  onPermissionsChange,
}: WorkerPermissionsSectionProps) {
  function handleRoleChange(value: string) {
    const next = value as WorkerRolePreset;
    const nextPermissions =
      next === "custom" ? permissions : getPresetPermissions(next);
    onRolePresetChange(next, nextPermissions);
  }

  function handleToggle(module: PermissionModule, checked: boolean) {
    const nextPermissions = setModuleEnabled(permissions, module, checked);
    const nextRolePreset = deriveRolePreset(nextPermissions);
    onPermissionsChange(nextPermissions, nextRolePreset);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="worker-role-preset" className="text-card-foreground">
          Rol del trabajador
        </Label>
        <Select value={rolePreset} onValueChange={handleRoleChange}>
          <SelectTrigger id="worker-role-preset" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {ROLE_PRESET_LABELS[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecciona un rol para precargar permisos. Si modificas un permiso,
          el rol pasará a &quot;Personalizado&quot;.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-card-foreground">
          Módulos del sistema
        </span>
        <div className="overflow-hidden rounded-lg border border-border">
          <ul className="divide-y divide-border">
            {PERMISSION_MODULES.map((module) => {
              const id = `perm-${module}`;
              const checked = isModuleEnabled(permissions, module);
              return (
                <li
                  key={module}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <Label
                    htmlFor={id}
                    className="cursor-pointer text-sm font-medium text-card-foreground"
                  >
                    {PERMISSION_MODULE_LABELS[module]}
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {checked ? "Habilitado" : "Deshabilitado"}
                    </span>
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={(value) =>
                        handleToggle(module, value === true)
                      }
                      className={CHECKBOX_CLASS}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Habilita un módulo para que el trabajador pueda usarlo. Más adelante
          podrás definir acciones específicas dentro de cada módulo (ver,
          crear, editar, etc.).
        </p>
      </div>
    </div>
  );
}
