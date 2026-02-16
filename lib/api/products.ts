import { apiFetch } from "./client";

export interface ProductListResponse {
  items: ProductSummary[];
  total: number;
}

export interface ProductSummary {
  id: string;
  title: string;
  status: string;
  brandId: string;
  brand?: { id: string; name: string; logoUrl: string | null };
  images?: { id: string; src: string; alt: string | null }[];
  enrichmentStatus?: string | null;
  enrichedAt?: string | null;
}

export interface ProductDetail extends ProductSummary {
  descriptionHtml: string | null;
  handle: string;
  variants?: { id: string; price: string; option1: string | null }[];
  images?: { id: string; src: string; alt: string | null; position: number }[];
}

export function fetchProducts(params: {
  brandId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductListResponse> {
  const sp = new URLSearchParams();
  if (params.brandId) sp.set("brandId", params.brandId);
  if (params.status) sp.set("status", params.status);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString();
  return apiFetch(`/api/products${q ? `?${q}` : ""}`);
}

export function fetchProduct(id: string): Promise<ProductDetail> {
  return apiFetch(`/api/products/${encodeURIComponent(id)}`);
}
