import { apiFetchWithAuth } from "./client";
import { getStoredToken } from "@/lib/auth/storage";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export interface WardrobeItem {
  id: string;
  userId: string;
  imageUrl: string;
  brand?: string | null;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  tags?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListWardrobeResponse {
  items: WardrobeItem[];
  total: number;
}

export interface WardrobeExtractSlotItem {
  type?: string | null;
  description?: string | null;
  category_lvl1?: string | null;
  color_primary?: string | null;
}

export interface WardrobeSuggestedProduct {
  productId: string;
  title: string;
  imageUrl?: string | null;
  category?: string | null;
  brand?: string | null;
}

export interface WardrobeExtractSlot {
  item: WardrobeExtractSlotItem;
  suggestedProducts: WardrobeSuggestedProduct[];
  /** When set, this slot has a crop from the look image; user can add it as "my item". */
  cropImageUrl?: string | null;
  /** True when user has already added this slot to wardrobe; slot should be hidden from carousel. */
  added?: boolean;
}

export interface WardrobeExtractResponse {
  slots: WardrobeExtractSlot[];
  look: { id: string; imageUrl?: string | null } | null;
  error?: string | null;
}

export interface WardrobeAcceptResponse {
  created: WardrobeItem[];
}

export interface WardrobeExtractionRecord {
  id: string;
  userId: string;
  lookId?: string | null;
  imageUrl: string;
  status: string;
  slots: WardrobeExtractSlot[];
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListWardrobeExtractionsResponse {
  items: WardrobeExtractionRecord[];
  total: number;
}

export interface AddFromLookResponse {
  wardrobeItem: WardrobeItem;
  extractionId: string;
}

/** Alias for WardrobeExtractSlot for backward compatibility */
export type ExtractSlot = WardrobeExtractSlot;

/**
 * List current user's wardrobe.
 */
export function listWardrobe(params?: { limit?: number; offset?: number; category?: string }): Promise<ListWardrobeResponse> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.category) sp.set("category", params.category);
  const q = sp.toString();
  return apiFetchWithAuth<ListWardrobeResponse>(`/api/wardrobe${q ? `?${q}` : ""}`);
}

/**
 * Add a look to wardrobe immediately and run extraction in background.
 * Returns the created wardrobe item and extraction id.
 */
export function addFromLook(params: { lookId?: string; imageUrl?: string }): Promise<AddFromLookResponse> {
  const { lookId, imageUrl } = params;
  if (!lookId && !imageUrl) {
    return Promise.reject(new Error("Provide lookId or imageUrl"));
  }
  return apiFetchWithAuth<AddFromLookResponse>("/api/wardrobe/add-from-look", {
    method: "POST",
    body: JSON.stringify({ lookId: lookId ?? undefined, imageUrl: imageUrl ?? undefined }),
  });
}

/**
 * List wardrobe extractions (for "Extracted looks" carousel). Default status=done.
 */
export function listWardrobeExtractions(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ListWardrobeExtractionsResponse> {
  const sp = new URLSearchParams();
  if (params?.status != null) sp.set("status", params.status);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString();
  return apiFetchWithAuth<ListWardrobeExtractionsResponse>(`/api/wardrobe/extractions${q ? `?${q}` : ""}`);
}

/**
 * Delete an extracted look (removes the extraction and its slots from the carousel).
 */
export function deleteWardrobeExtraction(extractionId: string): Promise<void> {
  return apiFetchWithAuth<void>(`/api/wardrobe/extractions/${encodeURIComponent(extractionId)}`, {
    method: "DELETE",
  });
}

/**
 * Upload an image to create a wardrobe item (multipart). Used by "Upload images for wardrobe".
 * Throws "Please sign in" if no auth token so upload failures are clear.
 */
export async function uploadWardrobeImage(file: File): Promise<WardrobeItem> {
  const token = getStoredToken();
  const url = `${BASE}/api/wardrobe/upload`;
  if (!token) {
    console.warn("[Wardrobe upload] No auth token – sign in to add images.");
    throw new Error("Please sign in to add images to your wardrobe.");
  }
  console.log("[Wardrobe upload] Sending file to", url, "size:", file.size, "type:", file.type);
  const form = new FormData();
  form.append("file", file);
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: form,
  });
  console.log("[Wardrobe upload] Response status:", res.status, res.statusText);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const msg = (err as { error?: string }).error || "Upload failed";
    console.error("[Wardrobe upload] Error:", msg);
    throw new Error(msg);
  }
  return res.json() as Promise<WardrobeItem>;
}

/**
 * Delete a wardrobe item by id.
 */
export function deleteWardrobeItem(id: string): Promise<void> {
  return apiFetchWithAuth<void>(`/api/wardrobe/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Accept selected product IDs and create wardrobe items. Alias for acceptWardrobeSuggestions.
 */
export function acceptSuggestions(params: { productIds: string[] }): Promise<WardrobeAcceptResponse> {
  return acceptWardrobeSuggestions(params.productIds);
}

/**
 * Extract items from a look for adding to wardrobe. Pass lookId, imageUrl, or file.
 */
export async function extractFromLook(params: {
  lookId?: string;
  imageUrl?: string;
  file?: File;
}): Promise<WardrobeExtractResponse> {
  const { lookId, imageUrl, file } = params;
  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/api/wardrobe/extract-from-look`, {
      method: "POST",
      headers,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return {
        slots: [],
        look: null,
        error: (err as { error?: string }).error || "Extraction failed",
      };
    }
    return res.json() as Promise<WardrobeExtractResponse>;
  }

  const body: { lookId?: string; imageUrl?: string } = {};
  if (lookId) body.lookId = lookId;
  if (imageUrl) body.imageUrl = imageUrl;
  if (!body.lookId && !body.imageUrl) {
    return { slots: [], look: null, error: "Provide lookId, imageUrl, or file" };
  }

  const res = await fetch(`${BASE}/api/wardrobe/extract-from-look`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    return {
      slots: [],
      look: null,
      error: (err as { error?: string }).error || "Extraction failed",
    };
  }
  return res.json() as Promise<WardrobeExtractResponse>;
}

/**
 * Accept selected product IDs and create wardrobe items.
 * Pass extractionId and extractionSlotIndex when adding from an extracted slot so the slot disappears from the carousel.
 */
export function acceptWardrobeSuggestions(
  productIds: string[],
  opts?: { extractionId?: string; extractionSlotIndex?: number }
): Promise<WardrobeAcceptResponse> {
  return apiFetchWithAuth<WardrobeAcceptResponse>("/api/wardrobe/accept-suggestions", {
    method: "POST",
    body: JSON.stringify({
      productIds,
      extractionId: opts?.extractionId,
      extractionSlotIndex: opts?.extractionSlotIndex,
    }),
  });
}

export interface CreateWardrobeItemParams {
  imageUrl: string;
  brand?: string | null;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  tags?: string | null;
  extractionId?: string | null;
  extractionSlotIndex?: number | null;
}

/**
 * Create a single wardrobe item from an image URL (e.g. crop from look). Used for "Add my item".
 */
export function createWardrobeItem(params: CreateWardrobeItemParams): Promise<WardrobeItem> {
  return apiFetchWithAuth<WardrobeItem>("/api/wardrobe", {
    method: "POST",
    body: JSON.stringify({
      imageUrl: params.imageUrl,
      brand: params.brand ?? undefined,
      category: params.category ?? undefined,
      color: params.color ?? undefined,
      size: params.size ?? undefined,
      tags: params.tags ?? undefined,
      extractionId: params.extractionId ?? undefined,
      extractionSlotIndex: params.extractionSlotIndex ?? undefined,
    }),
  });
}
