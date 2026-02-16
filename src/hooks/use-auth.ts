"use client";

import { useMutation } from "@tanstack/react-query";
import { login, register, verifyCode, resendCode } from "@/lib/auth";
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

// export function useResendMutation() {
//   return useMutation({
//     mutationFn: () => resendCode(),
//   });
// }
