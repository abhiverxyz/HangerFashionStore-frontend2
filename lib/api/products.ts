import { apiFetch, apiFetchWithAuth } from "./client";

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
  /** Display price when list API returns it (e.g. "₹999" or "From ₹599") */
  price?: string | null;
  /** List API may include first variant for price: [{ price: string }] */
  variants?: { price: string }[];
}

export interface ProductDetail extends ProductSummary {
  descriptionHtml: string | null;
  handle: string;
  variants?: { id: string; price: string; option1: string | null }[];
  images?: { id: string; src: string; alt: string | null; position: number }[];
  /** Catalog / enrichment fields */
  product_type?: string | null;
  vendor?: string | null;
  gender?: string | null;
  category_lvl1?: string | null;
  category_lvl2?: string | null;
  category_lvl3?: string | null;
  fabric_primary?: string | null;
  pattern?: string | null;
  fit?: string | null;
  length?: string | null;
  coverage?: string | null;
  color_primary?: string | null;
  color_family?: string | null;
  style_family?: string | null;
  occasion_primary?: string | null;
  occasion_secondary?: string | null;
  mood_vibe?: string | null;
  trend_tags?: string | null;
  price_band?: string | null;
  sleeve_length?: string | null;
  sleeve_style?: string | null;
  tags?: string | null;
}

export function fetchProducts(params: {
  brandId?: string;
  status?: string;
  limit?: number;
  offset?: number;
  /** When true and authenticated, backend returns personalized order (C+). Omit for fast diversity-only load. */
  personalized?: boolean;
}): Promise<ProductListResponse> {
  const sp = new URLSearchParams();
  if (params.brandId) sp.set("brandId", params.brandId);
  if (params.status) sp.set("status", params.status);
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.personalized === true) sp.set("personalized", "1");
  const q = sp.toString();
  return apiFetchWithAuth(`/api/products${q ? `?${q}` : ""}`);
}

export function fetchProduct(id: string): Promise<ProductDetail> {
  return apiFetch(`/api/products/${encodeURIComponent(id)}`);
}
