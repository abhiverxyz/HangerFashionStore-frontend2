import { apiFetchWithAuth } from "./client";

/** Fetch short-lived token for img src (cross-origin). Requires auth. */
export async function fetchStorageAccessToken(): Promise<string> {
  const res = await apiFetchWithAuth<{ token: string }>("/api/storage/access-token");
  return res.token;
}
