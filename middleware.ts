import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE_NAMES = {
  token: "auth_token",
  role: "user_role",
  planType: "user_plan_type",
} as const;

function isProPlan(planType: string | undefined): boolean {
  if (!planType) return false;
  const normalized = planType.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  return (
    normalized.includes("pro") ||
    normalized.includes("profesional") ||
    normalized.includes("premium") ||
    normalized.includes("plus")
  );
}

function isAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  return role.toLowerCase() === "admin";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAMES.token)?.value;
  const role = request.cookies.get(AUTH_COOKIE_NAMES.role)?.value;
  const planType = request.cookies.get(AUTH_COOKIE_NAMES.planType)?.value;

  const isDashboard = pathname.startsWith("/dashboard");
  const isPlans = pathname.startsWith("/plans");

  if (isDashboard || isPlans) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/dashboard/admin")) {
    if (!isAdminRole(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/dashboard/accounting-close/monthly")) {
    if (!isProPlan(planType)) {
      return NextResponse.redirect(new URL("/dashboard/accounting-close/daily", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/plans/:path*"],
};
