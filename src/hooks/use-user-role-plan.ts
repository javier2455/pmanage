"use client";

import { useSyncExternalStore } from "react";
import { getAuthCookies } from "@/lib/cookies";
import { isProPlan as checkProPlan } from "@/lib/pro-gates";
import { roleIdFromName } from "@/lib/roles";

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

function readRoleId(): string {
  if (typeof window === "undefined") return "";
  const stored = sessionStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const role = parsed.role ?? parsed.rol;
      /* getMe() entrega el rol como nombre (string): lo mapeamos al id que
         usan las secciones del backend ("admin" -> "5"). */
      if (typeof role === "string") return roleIdFromName(role);
      /* Compatibilidad por si el rol llegara como objeto { id, name }. */
      if (role && typeof role === "object" && role.id != null) {
        return String(role.id);
      }
    } catch {
      return "";
    }
  }
  return "";
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
  const roleId = useSyncExternalStore(subscribe, readRoleId, () => "");
  const planType = useSyncExternalStore(subscribe, readPlanType, () => "");

  const isAdmin = roleName.toLowerCase() === "admin";
  const isProPlan = checkProPlan(planType);

  return { roleName, roleId, planType, isAdmin, isProPlan };
}
