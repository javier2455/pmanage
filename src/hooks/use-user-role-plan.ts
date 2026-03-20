"use client";

import { useSyncExternalStore } from "react";
import { getAuthCookies } from "@/lib/cookies";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function readRoleName(): string {
  if (typeof window === "undefined") return "";
  const stored = sessionStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      /* email login usa `role`; getMe() crudo (Google) usa `rol` */
      const role = parsed.role ?? parsed.rol;
      return typeof role === "string" ? role : role?.name ?? "";
    } catch {
      return getAuthCookies().role ?? "";
    }
  }
  return getAuthCookies().role ?? "";
}

function readPlanType(): string {
  if (typeof window === "undefined") return "";
  const stored = sessionStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const plan = parsed.plan;
      return plan?.type ?? plan?.name ?? "";
    } catch {
      return getAuthCookies().planType ?? "";
    }
  }
  return getAuthCookies().planType ?? "";
}

function subscribe() {
  return () => {};
}

export function useUserRoleAndPlan() {
  const roleName = useSyncExternalStore(subscribe, readRoleName, () => "");
  const planType = useSyncExternalStore(subscribe, readPlanType, () => "");

  const isAdmin = roleName.toLowerCase() === "admin";
  const planNormalized = normalize(planType);
  const isProPlan =
    planNormalized.includes("pro") ||
    planNormalized.includes("profesional") ||
    planNormalized.includes("premium") ||
    planNormalized.includes("plus");

  return { roleName, planType, isAdmin, isProPlan };
}
