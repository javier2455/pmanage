"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { sileo } from "sileo";
import { ArrowLeft, Save, ShieldCheck, UserPlus, X } from "lucide-react";

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
import { useGetMenuListQuery } from "@/hooks/use-menu";
import type { MenuListItem } from "@/lib/types/menu";
import type {
  Worker,
  WorkerPermissoEntry,
} from "@/lib/types/worker";
import {
  workerEditFormSchema,
  workerFormSchema,
  type WorkerEditFormData,
  type WorkerFormData,
} from "@/lib/validations/workers";
import { WorkerPermissionsSection } from "./worker-permissions-section";

interface WorkerFormProps {
  mode: "create" | "edit";
  worker?: Worker;
}

const SUCCESS_TOAST_STYLES = {
  title: "text-white! text-[16px]! font-bold!",
  description: "text-white/90! text-[15px]!",
};

function buildPermisos(items: MenuListItem[]): WorkerPermissoEntry[] {
  return items.map((item) => ({
    read: true,
    write: true,
    update: true,
    delete: true,
    download: true,
    all: true,
    ...(item.idSubmenu
      ? { subMenuId: item.idSubmenu }
      : { menuId: item.idMenu }),
  }));
}

export function WorkerForm({ mode, worker }: WorkerFormProps) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const { activeBusinessId } = useBusiness();
  const createMutation = useCreateWorkerMutation();
  const updateMutation = useUpdateWorkerMutation();
  const isPending = isEdit ? updateMutation.isPending : createMutation.isPending;

  const { data: menuList } = useGetMenuListQuery();

  const [selected, setSelected] = useState<Map<string, MenuListItem>>(
    new Map(),
  );
  const selectedKeys = useMemo(
    () => new Set(selected.keys()),
    [selected],
  );

  useEffect(() => {
    if (!isEdit || !worker || !menuList) return;
    const permissionIds = new Set(worker.permissions);
    const next = new Map<string, MenuListItem>();
    for (const item of menuList) {
      const key = item.idSubmenu ?? item.idMenu;
      if (permissionIds.has(key)) {
        next.set(key, item);
      }
    }
    setSelected(next);
  }, [isEdit, worker, menuList]);

  const createForm = useForm<WorkerFormData>({
    resolver: zodResolver(workerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      job: "",
    },
  });

  const editForm = useForm<WorkerEditFormData>({
    resolver: zodResolver(workerEditFormSchema),
    defaultValues: {
      job: worker?.rol ?? "",
    },
  });

  function handleToggle(item: MenuListItem) {
    const key = item.idSubmenu ?? item.idMenu;
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, item);
      return next;
    });
  }

  async function handleCreate(data: WorkerFormData) {
    if (!activeBusinessId) {
      sileo.error({
        title: "Selecciona un negocio",
        description: "Activa un negocio antes de gestionar trabajadores.",
        styles: { description: "text-[#dc2626]/90! text-[15px]!" },
      });
      return;
    }

    const permisos = buildPermisos(Array.from(selected.values()));

    try {
      await createMutation.mutateAsync({
        businessId: activeBusinessId,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        job: data.job.trim(),
        permisos,
      });
      sileo.success({
        title: "Trabajador agregado",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: "El trabajador se ha agregado correctamente",
      });
      router.push("/dashboard/business/workers");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: error.response.data.message,
        });
      } else {
        sileo.error({
          title: "Error al guardar",
          description: "No se pudo guardar el trabajador. Intenta de nuevo.",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        });
      }
    }
  }

  async function handleUpdate(data: WorkerEditFormData) {
    if (!worker) return;

    const permisos = buildPermisos(Array.from(selected.values()));

    try {
      await updateMutation.mutateAsync({
        workerId: worker.id,
        credentials: {
          job: data.job.trim(),
          permisos,
        },
      });
      sileo.success({
        title: "Trabajador actualizado",
        fill: "",
        styles: SUCCESS_TOAST_STYLES,
        description: "El trabajador se ha actualizado correctamente",
      });
      router.push("/dashboard/business/workers");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        sileo.error({
          title: error.response?.data?.error ?? "Error",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
          description: error.response.data.message,
        });
      } else {
        sileo.error({
          title: "Error al actualizar",
          description: "No se pudo actualizar el trabajador. Intenta de nuevo.",
          styles: { description: "text-[#dc2626]/90! text-[15px]!" },
        });
      }
    }
  }

  function onInvalid() {
    sileo.error({
      title: "Revisa el formulario",
      description: "Hay campos con valores no válidos",
      styles: { description: "text-[#dc2626]/90! text-[15px]!" },
    });
  }

  const headerTitle = isEdit ? "Editar trabajador" : "Agregar trabajador";
  const headerSubtitle = isEdit
    ? "Actualiza el cargo o los permisos del trabajador"
    : "Completa la información del trabajador y sus permisos";

  const submitHandler = isEdit
    ? editForm.handleSubmit(handleUpdate, onInvalid)
    : createForm.handleSubmit(handleCreate, onInvalid);

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

      <form onSubmit={submitHandler} className="flex flex-col gap-6">
        {!isEdit && (
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
                  <CardDescription>Datos básicos del trabajador</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="worker-name" className="text-card-foreground">
                    Nombre
                  </Label>
                  <Input
                    id="worker-name"
                    placeholder="Ej: María González"
                    {...createForm.register("name")}
                    aria-invalid={
                      createForm.formState.errors.name ? "true" : "false"
                    }
                  />
                  {createForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {createForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="worker-phone" className="text-card-foreground">
                    Teléfono
                  </Label>
                  <Controller
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value ?? ""}
                        onChange={(value) => field.onChange(value)}
                        aria-invalid={
                          createForm.formState.errors.phone ? "true" : "false"
                        }
                      />
                    )}
                  />
                  {createForm.formState.errors.phone && (
                    <p className="text-xs text-destructive">
                      {createForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="worker-email" className="text-card-foreground">
                    Correo
                  </Label>
                  <Input
                    id="worker-email"
                    type="email"
                    placeholder="trabajador@example.com"
                    {...createForm.register("email")}
                    aria-invalid={
                      createForm.formState.errors.email ? "true" : "false"
                    }
                  />
                  {createForm.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {createForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-card-foreground">
                  Permisos del trabajador
                </CardTitle>
                <CardDescription>
                  Define el cargo y los módulos a los que el trabajador tendrá
                  acceso. Por ahora se otorgan todos los permisos de acción al
                  marcar un módulo.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="worker-job" className="text-card-foreground">
                Cargo
              </Label>
              <Input
                id="worker-job"
                placeholder="Ej: Cajero, Almacenista, Contador..."
                {...(isEdit
                  ? editForm.register("job")
                  : createForm.register("job"))}
                aria-invalid={
                  (isEdit
                    ? editForm.formState.errors.job
                    : createForm.formState.errors.job)
                    ? "true"
                    : "false"
                }
              />
              {isEdit
                ? editForm.formState.errors.job && (
                    <p className="text-xs text-destructive">
                      {editForm.formState.errors.job.message}
                    </p>
                  )
                : createForm.formState.errors.job && (
                    <p className="text-xs text-destructive">
                      {createForm.formState.errors.job.message}
                    </p>
                  )}
            </div>

            <WorkerPermissionsSection
              selectedKeys={selectedKeys}
              onToggle={handleToggle}
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
              : isEdit
                ? "Guardar cambios"
                : "Guardar trabajador"}
          </Button>
        </div>
      </form>
    </div>
  );
}
