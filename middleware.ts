import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProPlan, PRO_ROUTES } from "@/lib/pro-gates";

/**
 * ⚠️ INERTE EN PRODUCCIÓN: el proyecto se compila con `output: "export"`
 * (export estático, ver `next.config.ts`), y Next.js NO ejecuta el middleware
 * en ese modo. Este archivo NO protege la app desplegada hoy.
 *
 * La protección real vive en los guards de cliente del layout del dashboard
 * (`ReactivationGuard`, `PlanGuard`, `RouteGuard`, `AccessGuard`) y, como
 * autoridad final, en el backend (responde 401/403). Este middleware se
 * conserva como defensa "anti-parpadeo" para `next dev` o un futuro despliegue
 * en servidor Node/SSR (sin `output: export`). Mantener su lógica en paridad con
 * la de esos guards para que activarlo no introduzca discrepancias.
 */

const AUTH_COOKIE_NAMES = {
  token: "auth_token",
  role: "user_role",
  planType: "user_plan_type",
  deactivated: "user_deactivated",
  planExpired: "user_plan_expired",
  needsReconciliation: "user_needs_reconciliation",
} as const;

const REACTIVATION_PATH = "/cuenta-desactivada";
const SELECT_PLAN_PATH = "/seleccionar-plan";
const RECONCILE_PATH = "/seleccionar-plan/reconciliar";

function isAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return role.toLowerCase() === "admin";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAMES.token)?.value;
  const role = request.cookies.get(AUTH_COOKIE_NAMES.role)?.value;
  const planType = request.cookies.get(AUTH_COOKIE_NAMES.planType)?.value;
  const isDeactivated = Boolean(request.cookies.get(AUTH_COOKIE_NAMES.deactivated)?.value);
  const isPlanExpired = Boolean(request.cookies.get(AUTH_COOKIE_NAMES.planExpired)?.value);
  const needsReconciliation = Boolean(request.cookies.get(AUTH_COOKIE_NAMES.needsReconciliation)?.value);

  const isDashboard = pathname.startsWith("/dashboard");
  const isPlans = pathname.startsWith("/plans");
  const isReactivation = pathname.startsWith(REACTIVATION_PATH);
  const isSelectPlan = pathname.startsWith(SELECT_PLAN_PATH);

  // La pantalla de reactivación requiere sesión, pero solo es válida si el
  // usuario está realmente desactivado.
  if (isReactivation) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!isDeactivated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // El paywall de selección de plan requiere sesión, pero solo es válido si el
  // plan está realmente vencido / el usuario no tiene plan, o si tiene un exceso
  // de negocios que debe reconciliar (aunque el plan siga vigente).
  if (isSelectPlan) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isDeactivated) {
      return NextResponse.redirect(new URL(REACTIVATION_PATH, request.url));
    }
    if (!isPlanExpired && !needsReconciliation) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isDashboard || isPlans) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Usuario desactivado: solo puede acceder a la pantalla de reactivación.
    if (isDeactivated) {
      return NextResponse.redirect(new URL(REACTIVATION_PATH, request.url));
    }
    // Plan vencido / sin plan: bloquear el dashboard y forzar la selección.
    if (isPlanExpired) {
      return NextResponse.redirect(new URL(SELECT_PLAN_PATH, request.url));
    }
    // Exceso de negocios para el plan: bloquear el dashboard hasta reconciliar.
    if (needsReconciliation) {
      return NextResponse.redirect(new URL(RECONCILE_PATH, request.url));
    }
  }

  if (pathname.startsWith("/dashboard/admin")) {
    if (!isAdminRole(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  for (const route of PRO_ROUTES) {
    if (pathname.startsWith(route.path) && !isProPlan(planType)) {
      return NextResponse.redirect(new URL(route.redirect, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/plans/:path*", "/cuenta-desactivada", "/seleccionar-plan/:path*"],
};
