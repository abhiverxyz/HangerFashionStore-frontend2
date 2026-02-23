import { apiFetchWithAuth } from "./client";

export interface BrandSummary {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  followerCount?: number;
  productCount?: number;
  following?: boolean;
}

export interface BrandDetail extends BrandSummary {}

export interface ListBrandsResponse {
  items: BrandSummary[];
  total: number;
}

export function listBrands(params?: { limit?: number; offset?: number; search?: string }): Promise<ListBrandsResponse> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.search) sp.set("search", params.search);
  const q = sp.toString();
  return apiFetchWithAuth<ListBrandsResponse>(`/api/brands${q ? `?${q}` : ""}`);
}

export function getBrand(id: string): Promise<BrandDetail> {
  return apiFetchWithAuth<BrandDetail>(`/api/brands/${encodeURIComponent(id)}`);
}

export function followBrand(id: string): Promise<{ followed: boolean; brand: { id: string; followerCount: number } }> {
  return apiFetchWithAuth(`/api/brands/${encodeURIComponent(id)}/follow`, { method: "POST" });
}

export function unfollowBrand(id: string): Promise<{ followed: boolean; brand: { id: string; followerCount: number } }> {
  return apiFetchWithAuth(`/api/brands/${encodeURIComponent(id)}/follow`, { method: "DELETE" });
}
