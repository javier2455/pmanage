"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  login,
  register,
  verifyCode,
  resendCode,
  getMe,
  requestPasswordReset,
  changePassword,
} from "@/lib/api/auth";
import type { LoginFormData, RegisterFormData, VerifyFormData } from "@/lib/validations/auth";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: LoginFormData) => login(credentials),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (credentials: RegisterFormData) => register(credentials),
  });
}

export function useVerifyMutation() {
  return useMutation({
    mutationFn: (credentials: { email: string, code: string }) => verifyCode(credentials),
  });
}

export function useResendCode(email: string) {
  return useQuery({
    queryKey: ["resend-code", email],
    queryFn: () => resendCode({ email }),
  });
}

export function useAuthUserData() {
  return useQuery({
    queryKey: ["auth-user-data"],
    queryFn: () => getMe(),
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (payload: { email: string; urlCallback: string }) =>
      requestPasswordReset(payload),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: { password: string; token: string }) =>
      changePassword(payload),
  });
}