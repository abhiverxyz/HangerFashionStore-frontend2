"use client";

import useSWR from "swr";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getStorageAccessToken } from "@/lib/api/storageAccess";

/**
 * Returns a short-lived token for use with getImageDisplayUrl so private storage
 * images (e.g. look uploads) can be displayed. Null when not logged in or while loading.
 */
export function useStorageAccessToken(): string | null {
  const { user } = useAuth();
  const { data } = useSWR(
    user ? "storage-access-token" : null,
    () => getStorageAccessToken().then((r) => r.token),
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 }
  );
  return data ?? null;
}
