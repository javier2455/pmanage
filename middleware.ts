import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProPlan, PRO_ROUTES } from "@/lib/pro-gates";

const AUTH_COOKIE_NAMES = {
  token: "auth_token",
  role: "user_role",
  planType: "user_plan_type",
  deactivated: "user_deactivated",
} as const;

const REACTIVATION_PATH = "/cuenta-desactivada";

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

  const isDashboard = pathname.startsWith("/dashboard");
  const isPlans = pathname.startsWith("/plans");
  const isReactivation = pathname.startsWith(REACTIVATION_PATH);

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

  if (isDashboard || isPlans) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // Usuario desactivado: solo puede acceder a la pantalla de reactivación.
    if (isDeactivated) {
      return NextResponse.redirect(new URL(REACTIVATION_PATH, request.url));
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
  matcher: ["/dashboard/:path*", "/plans/:path*", "/cuenta-desactivada"],
};
