"use client";

import { useSyncExternalStore } from "react";
import { getAuthCookies } from "@/lib/cookies";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function getRoleAndPlan(): { roleName: string; planType: string } {
  if (typeof window === "undefined") return { roleName: "", planType: "" };
  const stored = sessionStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const role = parsed.role;
      const plan = parsed.plan;
      return {
        roleName: typeof role === "string" ? role : role?.name ?? "",
        planType: plan?.type ?? plan?.name ?? "",
      };
    } catch {
      const cookies = getAuthCookies();
      return { roleName: cookies.role ?? "", planType: cookies.planType ?? "" };
    }
  }
  const cookies = getAuthCookies();
  return { roleName: cookies.role ?? "", planType: cookies.planType ?? "" };
}

function subscribe() {
  return () => {};
}

export function useUserRoleAndPlan() {
  const { roleName, planType } = useSyncExternalStore(
    subscribe,
    getRoleAndPlan,
    () => ({ roleName: "", planType: "" })
  );

  const isAdmin = roleName.toLowerCase() === "admin";
  const planNormalized = normalize(planType);
  const isProPlan =
    planNormalized.includes("pro") ||
    planNormalized.includes("profesional") ||
    planNormalized.includes("premium") ||
    planNormalized.includes("plus");

  return { roleName, planType, isAdmin, isProPlan };
}
