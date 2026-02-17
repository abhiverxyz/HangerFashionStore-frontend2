/**
 * Brand dashboard API — for users with role "brand". All routes under /api/brand require auth.
 */
import { apiFetchWithAuth } from "./client";

export interface BrandMe {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  shopDomain: string;
  pageConfig: string | null;
  followerCount: number;
  productCount: number;
}

export function fetchBrandMe(): Promise<BrandMe> {
  return apiFetchWithAuth<BrandMe>("/api/brand/me");
}

export function updateBrandMe(body: Partial<BrandMe>): Promise<BrandMe> {
  return apiFetchWithAuth<BrandMe>("/api/brand/me", { method: "PUT", body: JSON.stringify(body) });
}

export interface BrandMicrostoreSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  productCount: number;
  followerCount: number;
  sections?: { label: string; productIds: string[] }[];
}

export function fetchBrandMicrostores(params?: { limit?: number; offset?: number }): Promise<{ items: BrandMicrostoreSummary[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return apiFetchWithAuth(`/api/brand/microstores${query ? `?${query}` : ""}`);
}

export function createBrandMicrostore(body: { name: string; description?: string; coverImageUrl?: string; status?: string }): Promise<BrandMicrostoreSummary> {
  return apiFetchWithAuth<BrandMicrostoreSummary>("/api/brand/microstores", { method: "POST", body: JSON.stringify(body) });
}

export function setBrandMicrostoreProducts(storeId: string, sections: { label: string; productIds: string[] }[]): Promise<BrandMicrostoreSummary> {
  return apiFetchWithAuth<BrandMicrostoreSummary>(`/api/brand/microstores/${encodeURIComponent(storeId)}/products`, {
    method: "PUT",
    body: JSON.stringify({ sections }),
  });
}

export interface BrandAnalytics {
  pageViews: number;
  followers: number;
  products: number;
  microstores: number;
}

export function fetchBrandAnalytics(): Promise<BrandAnalytics> {
  return apiFetchWithAuth<BrandAnalytics>("/api/brand/analytics");
}
