"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { fetchStorageAccessToken } from "@/lib/api/storage";

const REFETCH_MS = 4 * 60 * 1000;

const StorageAccessContext = createContext<string | null>(null);

export function StorageAccessProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [storageToken, setStorageToken] = useState<string | null>(null);
  const refetchAt = useRef<number>(0);

  const ensureToken = useCallback(async () => {
    if (!token) {
      setStorageToken(null);
      return;
    }
    const now = Date.now();
    if (now < refetchAt.current) return;
    try {
      const t = await fetchStorageAccessToken();
      setStorageToken(t);
      refetchAt.current = now + REFETCH_MS;
    } catch {
      setStorageToken(null);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setStorageToken(null);
      refetchAt.current = 0;
      return;
    }
    ensureToken();
    const id = setInterval(ensureToken, REFETCH_MS);
    return () => clearInterval(id);
  }, [token, ensureToken]);

  return (
    <StorageAccessContext.Provider value={storageToken}>
      {children}
    </StorageAccessContext.Provider>
  );
}

/** Returns storage access token when logged in; null otherwise. Safe to use anywhere. */
export function useStorageAccessToken(): string | null {
  return useContext(StorageAccessContext) ?? null;
}
