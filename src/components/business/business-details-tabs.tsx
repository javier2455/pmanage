"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Bell, Clock, Store, TriangleAlert } from "lucide-react";
import { useBusiness } from "@/context/business-context";
import { BusinessDetailsForm } from "./business-details-form";
import { BusinessScheduleCard } from "./business-schedule-card";
import { NotificationSettingsCard } from "./notification-settings-card";
import { BusinessDangerZone } from "./business-danger-zone";

const VALID_TABS = ["detalles", "horario", "notificaciones", "eliminar"] as const;
type TabValue = (typeof VALID_TABS)[number];

function isTabValue(value: string | null): value is TabValue {
  return value !== null && (VALID_TABS as readonly string[]).includes(value);
}

/**
 * Organiza la configuración del negocio en pestañas para no apilar todas las
 * secciones en una página larguísima. El tab activo se persiste en `?tab=` para
 * sobrevivir a refrescos y poder compartir un enlace directo a una sección.
 *
 * "Detalles" y "Ubicación" viven juntos (mismo formulario / estado de edición),
 * por eso ambos van dentro de `BusinessDetailsForm` en la primera pestaña.
 */
export function BusinessDetailsTabs() {
  const { activeBusiness } = useBusiness();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "detalles";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-6">
      <TabsList className="w-full justify-start overflow-x-auto overflow-y-hidden sm:w-fit">
        <TabsTrigger value="detalles">
          <Store />
          Detalles
        </TabsTrigger>
        <TabsTrigger value="horario">
          <Clock />
          Horario
        </TabsTrigger>
        <TabsTrigger value="notificaciones">
          <Bell />
          Notificaciones
        </TabsTrigger>
        <TabsTrigger value="eliminar">
          <TriangleAlert />
          Eliminar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="detalles" className="flex flex-col gap-6">
        <BusinessDetailsForm />
      </TabsContent>

      <TabsContent value="horario">
        <BusinessScheduleCard business={activeBusiness} />
      </TabsContent>

      <TabsContent value="notificaciones">
        <NotificationSettingsCard business={activeBusiness} />
      </TabsContent>

      <TabsContent value="eliminar">
        <BusinessDangerZone />
      </TabsContent>
    </Tabs>
  );
}
