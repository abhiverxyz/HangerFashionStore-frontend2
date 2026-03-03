import { apiFetchWithAuth } from "./client";

export interface CurrentUser {
  id: string;
  email?: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  brandId?: string;
}

export function getCurrentUser(): Promise<CurrentUser> {
  return apiFetchWithAuth<CurrentUser>("/api/user/me");
}
