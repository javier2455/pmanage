"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getMe } from "@/lib/api/auth";
import { getActivePlan } from "@/lib/api/plans";
import { getMyBusinessesList } from "@/lib/api/business";
import { getAllSections } from "@/lib/api/navigation";
import { collectAllowedUrls } from "@/lib/navigation-access";
import { roleIdFromName } from "@/lib/roles";
import {
  setAuthCookies,
  setDeactivatedCookie,
  setPlanExpiredCookie,
  setNeedsReconciliationCookie,
} from "@/lib/cookies";
import { getMaxBusinesses } from "@/lib/pro-gates";
import type { LoginType } from "@/components/auth/login-type-selection-modal";

export type AuthUser = Awaited<ReturnType<typeof getMe>>;

type LoginMode = "owner" | "worker";

export interface SessionTokens {
  accessToken: string;
  refreshToken?: string;
}

interface PendingLogin extends SessionTokens {
  user: AuthUser;
}

interface UsePostLoginOptions {
  /** Se invoca si algo falla al enrutar tras una autenticación correcta. */
  onError: (message: string) => void;
}

/**
 * Todo lo que ocurre DESPUÉS de obtener un par de tokens válido: persistir la
 * sesión, consultar `/auth/me` y decidir a qué pantalla entra el usuario.
 *
 * Vive aquí y no dentro de la página de login porque el alta con Google entra
 * por la pantalla de registro y tiene que aterrizar exactamente igual que un
 * inicio de sesión normal. Cuando esta lógica estaba embebida en el login, la
 * pantalla de registro no podía reutilizarla.
 */
export function usePostLogin({ onError }: UsePostLoginOptions) {
  const router = useRouter();
  const [showLoginTypeModal, setShowLoginTypeModal] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);

  const persistSessionUser = (
    user: AuthUser,
    accessToken: string,
    refreshToken?: string,
  ) => {
    sessionStorage.setItem("token", accessToken);
    if (refreshToken) {
      sessionStorage.setItem("refresh_token", refreshToken);
    }
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        email: user.email,
        plan: user.plan,
        avatar: user.avatar,
      }),
    );
    const roleName = user.role ?? "";
    const planType = user.plan?.type ?? user.plan?.name ?? "";
    setAuthCookies({
      token: accessToken,
      role: roleName,
      planType,
    });
    // Si la cuenta ya está desactivada, sembramos la cookie para que el
    // middleware redirija a la pantalla de reactivación sin parpadeo.
    setDeactivatedCookie(user.deactivatedAt);
    // Si el plan está vencido o nunca tuvo plan, sembramos la cookie para que
    // el middleware redirija al paywall de selección de plan sin parpadeo.
    // El PlanGuard la corrige luego con /auth/me.
    setPlanExpiredCookie(Boolean(user.expiredPlan || user.hasNeverHadPlan));
  };

  const finalizePostLogin = async ({
    accessToken,
    refreshToken,
    user,
    mode,
  }: PendingLogin & { mode: LoginMode }) => {
    persistSessionUser(user, accessToken, refreshToken);
    sessionStorage.setItem("loginMode", mode);

    if (mode === "worker") {
      const businesses = await getMyBusinessesList();
      /* En modo worker solo cuentan los negocios donde es trabajador;
         my-business también incluye los propios. Coincide con el filtro
         del BusinessProvider para que el destino sea coherente. */
      const workerBusinesses = businesses.filter((b) => b.isWorker === true);
      if (workerBusinesses.length === 0) {
        router.push("/dashboard/business/create");
        return;
      }
      /* Aterrizamos en la primera ruta a la que el trabajador realmente
         tiene acceso (no en /dashboard fijo). Persistimos el negocio
         activo para que las secciones consultadas coincidan con las que
         cargará el dashboard al montar. */
      const activeBusiness = workerBusinesses[0];
      sessionStorage.setItem("activeBusinessId", activeBusiness.id);
      const sections = await getAllSections({ businessId: activeBusiness.id });
      /* Preferir el roleId numérico del backend (#21); fallback a la tabla local. */
      const roleId =
        user.roleId != null
          ? String(user.roleId)
          : roleIdFromName(user.role ?? "");
      const allowedUrls = collectAllowedUrls(sections, roleId);
      router.push(allowedUrls.find(Boolean) ?? "/dashboard/no-access");
      return;
    }

    const activePlan = await getActivePlan();
    if (activePlan?.data?.isActive || activePlan?.isActive) {
      const businesses = await getMyBusinessesList();
      const activeBusinesses = businesses.filter((b) => b.status !== "archived");
      if (activeBusinesses.length === 0) {
        setNeedsReconciliationCookie(false);
        router.push("/dashboard/business/create");
        return;
      }
      /* Si el usuario quedó con más negocios activos de los que permite su
         plan (p. ej. tras expirar el trial Pro), debe elegir cuál conservar
         antes de entrar al dashboard. Sembramos la cookie para que el
         middleware bloquee el dashboard hasta que reconcilie. */
      const planType = user.plan?.type ?? user.plan?.name ?? "";
      const maxBiz = user.plan?.limits?.maxBusinesses ?? getMaxBusinesses(planType);
      if (activeBusinesses.length > maxBiz) {
        setNeedsReconciliationCookie(true);
        router.push("/seleccionar-plan/reconciliar");
        return;
      }
      setNeedsReconciliationCookie(false);
      router.push("/dashboard");
    } else {
      router.push("/plans");
    }
  };

  const routeAfterGetMe = async (params: PendingLogin) => {
    const { user } = params;
    // Cuenta desactivada: persistimos la sesión y enviamos directo a la
    // pantalla de reactivación, sin elegir modo ni comprobar plan/negocios.
    if (user.deactivatedAt) {
      persistSessionUser(user, params.accessToken, params.refreshToken);
      router.replace("/cuenta-desactivada");
      return;
    }
    if (user.isWorker && !user.isOwner) {
      await finalizePostLogin({ ...params, mode: "worker" });
      return;
    }
    if (user.isOwner && user.isWorker) {
      setPendingLogin(params);
      setShowLoginTypeModal(true);
      return;
    }
    await finalizePostLogin({ ...params, mode: "owner" });
  };

  const handleLoginTypeSelect = async (type: LoginType) => {
    if (!pendingLogin) return;
    const mode: LoginMode = type === "business-member" ? "worker" : "owner";
    setShowLoginTypeModal(false);
    try {
      await finalizePostLogin({ ...pendingLogin, mode });
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "No se pudo completar el inicio de sesión.",
      );
    } finally {
      setPendingLogin(null);
    }
  };

  /**
   * Punto de entrada único: recibe los tokens (vengan del formulario o de
   * Google), deja la sesión lista y enruta.
   *
   * El token se guarda ANTES de llamar a `/auth/me` porque el interceptor de
   * `apiClient` lo lee de `sessionStorage` para firmar la petición.
   */
  const completeLogin = async ({ accessToken, refreshToken }: SessionTokens) => {
    sessionStorage.setItem("token", accessToken);
    if (refreshToken) {
      sessionStorage.setItem("refresh_token", refreshToken);
    }
    const user = await getMe();
    await routeAfterGetMe({ accessToken, refreshToken, user });
  };

  return {
    completeLogin,
    /** Props del modal que pregunta si entra como dueño o como trabajador. */
    loginTypeModal: {
      open: showLoginTypeModal,
      onSelect: handleLoginTypeSelect,
    },
  };
}
