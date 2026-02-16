import type { User } from "@/lib/types/auth";
import { apiFetch } from "./client";

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SessionResponse {
  user: User;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getSession(token: string): Promise<SessionResponse> {
  return apiFetch("/api/auth/session", { token });
}
