"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import type { Role } from "@/lib/types/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Use on protected pages (e.g. /admin, /brand). Redirects to /login if not authenticated,
 * or to the correct dashboard if authenticated but wrong role. Returns { user, loading } when allowed.
 */
export function useRequireAuth(allowedRole: Role): { user: NonNullable<ReturnType<typeof useAuth>["user"]>; loading: boolean } | { user: null; loading: true } {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== allowedRole) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "brand") router.replace("/brand");
      else router.replace("/browse");
    }
  }, [user, loading, allowedRole, router]);

  if (loading || !user || user.role !== allowedRole) {
    return { user: null, loading: true };
  }
  return { user, loading: false };
}
