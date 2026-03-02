"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { login, register, verifyCode, resendCode } from "@/lib/api/auth";
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
