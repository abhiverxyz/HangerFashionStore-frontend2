import { apiFetchWithAuth, apiFetch } from "./client";

export interface MicrostoreSummary {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  status: string;
  visibilityScope?: string | null;
  sections?: { label: string; productIds: string[] }[];
  followerCount?: number;
  brand?: { id: string; name: string; logoUrl: string | null };
}

export interface MicrostoreDetail extends MicrostoreSummary {
  styleNotes?: unknown;
  products?: { id: string; title: string; imageUrl?: string; brand?: { id: string; name: string }; variants?: { price: string }[] }[];
}

export interface ListMicrostoresResponse {
  items: MicrostoreSummary[];
  total: number;
}

export function listMicrostores(params?: {
  brandId?: string;
  status?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}): Promise<ListMicrostoresResponse> {
  const sp = new URLSearchParams();
  if (params?.brandId) sp.set("brandId", params.brandId);
  if (params?.status) sp.set("status", params.status);
  if (params?.featured !== undefined) sp.set("featured", String(params.featured));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString();
  return apiFetchWithAuth<ListMicrostoresResponse>(`/api/microstores${q ? `?${q}` : ""}`);
}

export function getMicrostore(id: string): Promise<MicrostoreDetail> {
  return apiFetchWithAuth<MicrostoreDetail>(`/api/microstores/${encodeURIComponent(id)}`);
}

export function getStoreForMe(): Promise<MicrostoreDetail> {
  return apiFetchWithAuth<MicrostoreDetail>("/api/microstores/store-for-me");
}

export function refreshStoreForMe(): Promise<MicrostoreDetail> {
  return apiFetchWithAuth<MicrostoreDetail>("/api/microstores/store-for-me", { method: "POST" });
}

export function followMicrostore(id: string): Promise<{ followed: boolean }> {
  return apiFetchWithAuth(`/api/microstores/${encodeURIComponent(id)}/follow`, { method: "POST" });
}

export function unfollowMicrostore(id: string): Promise<{ followed: boolean }> {
  return apiFetchWithAuth(`/api/microstores/${encodeURIComponent(id)}/follow`, { method: "DELETE" });
}
