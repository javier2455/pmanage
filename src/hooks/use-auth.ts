"use client";

import { useMutation } from "@tanstack/react-query";
import { login } from "@/lib/auth";
import type { LoginFormData, RegisterFormData } from "@/lib/validations/auth";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (credentials: LoginFormData) => login(credentials),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (credentials: RegisterFormData) => login(credentials),
  });
}
