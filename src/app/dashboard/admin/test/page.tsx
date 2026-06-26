import { TestRunner } from "@/components/admin-test/test-runner";

/**
 * Panel admin para ejecutar las suites de lógica pura en el navegador.
 *
 * Acceso: protegido por `RouteGuard` (rol admin) + `AccessGuard` (la ruta debe
 * estar registrada en "Gestionar menús"). Registra el menú con URL
 * `/dashboard/admin/test`, rol `admin` e icono `ListChecks`.
 */
export default function AdminTestPage() {
  return <TestRunner />;
}
