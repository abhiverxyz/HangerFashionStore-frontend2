import { apiFetchWithAuth } from "./client";

export interface StorageAccessTokenResponse {
  token: string;
}

/** GET /api/storage/access-token — short-lived token for img src access to private storage. Auth required. */
export function getStorageAccessToken(): Promise<StorageAccessTokenResponse> {
  return apiFetchWithAuth<StorageAccessTokenResponse>("/api/storage/access-token");
}
