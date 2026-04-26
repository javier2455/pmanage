"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sileo } from "sileo";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImagePlus,
  Save,
  Upload,
  UserPlus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { useBusiness } from "@/context/business-context";
import {
  useCreateWorkerMutation,
  useUpdateWorkerMutation,
} from "@/hooks/use-workers";
import {
  clonePermissions,
  emptyPermissions,
  ROLE_PRESET_LABELS,
  type Worker,
  type WorkerPermissions,
  type WorkerRolePreset,
} from "@/lib/types/worker";
import { getPresetPermissions } from "@/lib/workers/role-presets";
import {
  trimToNull,
  workerFormSchema,
  type WorkerFormData,
} from "@/lib/validations/workers";
import { WorkerPermissionsSection } from "./worker-permissions-section";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

interface WorkerFormProps {
  mode: "create" | "edit";
  worker?: Worker;
}

export function WorkerForm({ mode, worker }: WorkerFormProps) {
  const router = useRouter();
  const { activeBusinessId } = useBusiness();
  const createMutation = useCreateWorkerMutation();
  const updateMutation = useUpdateWorkerMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    worker?.avatar ?? null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const initialPermissions: WorkerPermissions = worker
    ? clonePermissions(worker.permissions)
    : clonePermissions(getPresetPermissions("dependiente"));
  const initialRolePreset: WorkerRolePreset = worker?.rolePreset ?? "dependiente";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WorkerFormData>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      fullName: worker?.fullName ?? "",
      phone: worker?.phone ?? "",
      email: worker?.email ?? "",
      password: "",
      rolePreset: initialRolePreset,
      permissions: initialPermissions,
    },
  });

  const rolePreset = watch("rolePreset");
  const permissions = watch("permissions") as WorkerPermissions;

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      sileo.error({
        title: "Imagen demasiado grande",
        description: "La imagen no debe superar los 2 MB.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRolePresetChange(
    next: WorkerRolePreset,
    nextPermissions: WorkerPermissions,
  ) {
    setValue("rolePreset", next, { shouldDirty: true });
    setValue("permissions", nextPermissions, { shouldDirty: true });
  }

  function handlePermissionsChange(
    nextPermissions: WorkerPermissions,
    nextRolePreset: WorkerRolePreset,
  ) {
    setValue("permissions", nextPermissions, { shouldDirty: true });
    if (nextRolePreset !== rolePreset) {
      setValue("rolePreset", nextRolePreset, { shouldDirty: true });
    }
  }

  async function onSubmit(data: WorkerFormData) {
    if (!activeBusinessId) {
      sileo.error({
        title: "Selecciona un negocio",
        description: "Activa un negocio antes de gestionar trabajadores.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
      return;
    }

    const fullPermissions: WorkerPermissions = {
      ...emptyPermissions(),
      ...data.permissions,
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          businessId: activeBusinessId,
          fullName: trimToNull(data.fullName),
          phone: trimToNull(data.phone),
          email: trimToNull(data.email),
          password: trimToNull(data.password),
          avatarFile,
          rolePreset: data.rolePreset,
          permissions: fullPermissions,
        });
        sileo.success({
          title: "Trabajador agregado",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: "El trabajador se ha agregado correctamente",
        });
      } else if (worker) {
        await updateMutation.mutateAsync({
          id: worker.id,
          businessId: worker.businessId,
          fullName: trimToNull(data.fullName),
          phone: trimToNull(data.phone),
          email: trimToNull(data.email),
          password: trimToNull(data.password),
          avatarFile,
          rolePreset: data.rolePreset,
          permissions: fullPermissions,
        });
        sileo.success({
          title: "Trabajador actualizado",
          fill: "",
          styles: {
            title: "text-white! text-[16px]! font-bold!",
            description: "text-white/90! text-[15px]!",
          },
          description: "Los cambios se han guardado correctamente",
        });
      }
      router.push("/dashboard/business/workers");
    } catch {
      sileo.error({
        title: "Error al guardar",
        description: "No se pudo guardar el trabajador. Intenta de nuevo.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
    }
  }

  const headerTitle = mode === "create" ? "Agregar trabajador" : "Editar trabajador";
  const headerSubtitle =
    mode === "create"
      ? "Completa la información del trabajador y sus permisos"
      : "Actualiza los datos o permisos del trabajador";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/business/workers"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {headerTitle}
          </h1>
          <p className="text-muted-foreground">{headerSubtitle}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, () => {
          sileo.error({
            title: "Revisa el formulario",
            description: "Hay campos con valores no válidos",
            styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          });
        })}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Información del trabajador
                </CardTitle>
                <CardDescription>
                  Todos los campos son opcionales
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-card-foreground">Imagen</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                aria-label="Subir imagen del trabajador"
              />
              {avatarPreview ? (
                <div className="relative h-32 w-32 overflow-hidden rounded-full border border-border">
                  <Image
                    src={avatarPreview}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={clearAvatar}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                    aria-label="Quitar imagen"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Upload className="h-3 w-3" />
                      <span>Subir</span>
                    </div>
                  </div>
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceptados: JPG, PNG o WEBP. Tamaño máximo: 2&nbsp;MB.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="worker-full-name" className="text-card-foreground">
                  Nombre completo
                </Label>
                <Input
                  id="worker-full-name"
                  placeholder="Ej: María González"
                  {...register("fullName")}
                  aria-invalid={errors.fullName ? "true" : "false"}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="worker-phone" className="text-card-foreground">
                  Teléfono
                </Label>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <PhoneInput
                      value={field.value ?? ""}
                      onChange={(value) => field.onChange(value)}
                      aria-invalid={errors.phone ? "true" : "false"}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="worker-email" className="text-card-foreground">
                  Correo
                </Label>
                <Input
                  id="worker-email"
                  type="email"
                  placeholder="trabajador@example.com"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="worker-password" className="text-card-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="worker-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      mode === "edit" ? "Dejar en blanco para no cambiar" : "Mínimo 8 caracteres"
                    }
                    autoComplete="new-password"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Permisos del trabajador
                </CardTitle>
                <CardDescription>
                  Define qué módulos podrá ver y gestionar dentro del sistema.
                  Rol actual:{" "}
                  <span className="font-medium text-foreground">
                    {ROLE_PRESET_LABELS[rolePreset]}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WorkerPermissionsSection
              rolePreset={rolePreset}
              permissions={permissions}
              onRolePresetChange={handleRolePresetChange}
              onPermissionsChange={handlePermissionsChange}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="default" asChild>
            <Link href="/dashboard/business/workers">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending
              ? "Guardando..."
              : mode === "create"
              ? "Guardar trabajador"
              : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
