"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSession } from "@/lib/api/auth";
import type { User } from "@/lib/types/auth";
import { getStoredToken, setStoredToken } from "@/lib/auth/storage";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    setStoredToken(t);
    setTokenState(t);
    if (!t) setUser(null);
  }, []);

  const logout = useCallback(() => setToken(null), [setToken]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? getStoredToken() : null;
    if (!stored) {
      setLoading(false);
      return;
    }
    setTokenState(stored);
    getSession(stored)
      .then((r) => setUser(r.user))
      .catch(() => setStoredToken(null))
      .finally(() => setLoading(false));
  }, []);

  const value: AuthState = {
    token,
    user,
    loading,
    setToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
