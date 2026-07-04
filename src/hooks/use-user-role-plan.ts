"use client";

import { useSyncExternalStore } from "react";
import { getAuthCookies } from "@/lib/cookies";
import {
  isProPlan as checkProPlan,
  getMaxBusinesses as fallbackMaxBusinesses,
} from "@/lib/pro-gates";
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
      /* Preferir el roleId numérico que ahora expone /auth/me (#21): así no
         dependemos de la tabla local nombre->id (ROLE_ID_BY_NAME). */
      if (parsed.roleId != null) return String(parsed.roleId);
      const role = parsed.role ?? parsed.rol;
      /* Fallback: getMe() entregaba el rol como nombre; lo mapeamos al id. */
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

/** "1"/"0" si el backend indicó plan.isPro; "" si no lo trae (fallback local). */
function readPlanIsPro(): string {
  if (typeof window === "undefined") return "";
  const stored = sessionStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const isPro = parsed.plan?.isPro;
      if (typeof isPro === "boolean") return isPro ? "1" : "0";
    } catch {
      return "";
    }
  }
  return "";
}

/** Nº de negocios permitido según `plan.limits` del backend; "" si no viene. */
function readMaxBusinesses(): string {
  if (typeof window === "undefined") return "";
  const stored = sessionStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const max = parsed.plan?.limits?.maxBusinesses;
      if (typeof max === "number" && max > 0) return String(max);
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
  const planIsProFlag = useSyncExternalStore(subscribe, readPlanIsPro, () => "");
  const maxBusinessesFlag = useSyncExternalStore(
    subscribe,
    readMaxBusinesses,
    () => "",
  );

  const isAdmin = roleName.toLowerCase() === "admin";
  /* Preferir el flag isPro del backend (#21); si no viene, usar la detección
     local por nombre de plan como fallback. */
  const isProPlan =
    planIsProFlag === "" ? checkProPlan(planType) : planIsProFlag === "1";
  /* Igual con el tope de negocios: preferir plan.limits.maxBusinesses del
     backend; si no viene, el cálculo local por tipo de plan. */
  const maxBusinesses =
    maxBusinessesFlag === ""
      ? fallbackMaxBusinesses(planType)
      : Number(maxBusinessesFlag);

  return { roleName, roleId, planType, isAdmin, isProPlan, maxBusinesses };
}
