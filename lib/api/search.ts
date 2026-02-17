import { apiFetchWithAuth } from "./client";

export interface SearchProductItem {
  id: string;
  title: string;
  handle?: string;
  brand?: { id: string; name: string; logoUrl: string | null };
  images?: { id: string; src: string; alt: string | null }[];
}

export interface SearchResponse {
  items: SearchProductItem[];
  total: number;
}

export interface SearchParams {
  query?: string;
  imageUrl?: string;
  limit?: number;
  offset?: number;
  brandId?: string;
  category_lvl1?: string;
}

/**
 * POST /api/search — natural language or image-based product search (B3.4).
 */
export function searchProducts(params: SearchParams): Promise<SearchResponse> {
  return apiFetchWithAuth("/api/search", {
    method: "POST",
    body: JSON.stringify({
      query: params.query?.trim() || undefined,
      imageUrl: params.imageUrl?.trim() || undefined,
      limit: params.limit,
      offset: params.offset,
      brandId: params.brandId || undefined,
      category_lvl1: params.category_lvl1 || undefined,
    }),
  });
}
