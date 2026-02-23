import { apiFetchWithAuth } from "./client";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export interface WardrobeItem {
  id: string;
  userId: string;
  imageUrl: string;
  brand: string | null;
  category: string | null;
  color: string | null;
  size: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListWardrobeResponse {
  items: WardrobeItem[];
  total: number;
}

export interface ExtractSlot {
  type?: string;
  description?: string;
  category_lvl1?: string;
  color_primary?: string;
  suggestedProductIds?: string[];
  suggestedProducts?: { productId: string; title?: string; imageUrl?: string; category?: string; brand?: string }[];
}

export interface ExtractFromLookResponse {
  slots: ExtractSlot[];
  look: { id: string; imageUrl?: string } | null;
  error?: string | null;
}

export function listWardrobe(params?: { limit?: number; offset?: number; category?: string }): Promise<ListWardrobeResponse> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.category) sp.set("category", params.category);
  const q = sp.toString();
  return apiFetchWithAuth<ListWardrobeResponse>(`/api/wardrobe${q ? `?${q}` : ""}`);
}

export function getWardrobeItem(id: string): Promise<WardrobeItem> {
  return apiFetchWithAuth<WardrobeItem>(`/api/wardrobe/${encodeURIComponent(id)}`);
}

export function extractFromLook(body: { lookId?: string; imageUrl?: string }): Promise<ExtractFromLookResponse> {
  return apiFetchWithAuth<ExtractFromLookResponse>("/api/wardrobe/extract-from-look", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function extractFromLookFile(file: File): Promise<ExtractFromLookResponse> {
  const token = (await import("@/lib/auth/storage")).getStoredToken();
  const form = new FormData();
  form.append("file", file);
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/wardrobe/extract-from-look`, { method: "POST", headers, body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || "Extraction failed");
  }
  return res.json();
}

export function suggestForItem(body: {
  item: { description?: string; category_lvl1?: string; color_primary?: string };
  limit?: number;
}): Promise<{ suggestedProducts: { productId: string; title?: string; imageUrl?: string; category?: string; brand?: string }[] }> {
  return apiFetchWithAuth("/api/wardrobe/suggest-for-item", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function acceptSuggestions(body: { productIds: string[] }): Promise<{ created: WardrobeItem[] }> {
  return apiFetchWithAuth("/api/wardrobe/accept-suggestions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteWardrobeItem(id: string): Promise<void> {
  return apiFetchWithAuth(`/api/wardrobe/${encodeURIComponent(id)}`, { method: "DELETE" });
}
