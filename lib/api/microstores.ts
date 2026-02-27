import { apiFetchWithAuth, apiFetch, API_BASE_URL } from "./client";
import { getStoredToken } from "@/lib/auth/storage";

/** Resolve microstore cover URL for img src (prefix relative /api/storage/access paths with API base). */
export function resolveMicrostoreCoverUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith("/")) return `${API_BASE_URL}${u}`;
  return u;
}

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

/** Single "Idea for you" card (title + text + gradientId for carousel). */
export interface IdeaForYou {
  title: string;
  text: string;
  gradientId: string;
}

export interface MicrostoreDetail extends MicrostoreSummary {
  styleNotes?: unknown;
  ideasForYou?: IdeaForYou[];
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

/** Whether the current user is allowed to create microstores (admin, brand, or in allowed list). */
export function canCreateMicrostore(): Promise<{ allowed: boolean }> {
  return apiFetchWithAuth<{ allowed: boolean }>("/api/user/can-create-microstore");
}

/** Suggest name and details for microstore creation (allowed creators). */
export interface SuggestMicrostoreNameResult {
  name: string;
  description: string;
  vibe: string;
  trends: string;
  categories: string;
  styleNotes?: { text: string; links: { title: string; url: string; type?: string; description?: string; imageUrl?: string }[] };
}

export function suggestMicrostoreNameUser(body: {
  description: string;
  vibe?: string;
  trend?: string;
  category?: string;
}): Promise<SuggestMicrostoreNameResult> {
  return apiFetchWithAuth<SuggestMicrostoreNameResult>("/api/microstores/suggest-name", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Create microstore as draft (allowed creators). */
export function createMicrostoreUser(body: {
  name: string;
  description?: string;
  vibe?: string;
  trends?: string;
  categories?: string;
  coverImageUrl?: string;
  styleNotes?: unknown;
  sections?: { label: string; productIds: string[] }[];
}): Promise<MicrostoreDetail> {
  return apiFetchWithAuth<MicrostoreDetail>("/api/microstores", {
    method: "POST",
    body: JSON.stringify({ ...body, status: "draft" }),
  });
}

/** Suggest a single style note card (allowed creators). */
export function suggestOneStyleNoteUser(body: {
  description?: string;
  vibe?: string;
  trend?: string;
  category?: string;
  existingTitles?: string[];
}): Promise<{ card: { title: string; description?: string; backgroundColor?: string; fontStyle?: string } }> {
  return apiFetchWithAuth("/api/microstores/suggest-one-style-note", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Suggest products for microstore (allowed creators). */
export function suggestProductsForMicrostoreUser(body: {
  storeId?: string;
  name?: string;
  description?: string;
  vibe?: string;
  limit?: number;
  groupBySection?: boolean;
}): Promise<{ products: { id: string; title?: string; images?: { src?: string; url?: string }[] }[]; bySection: { label: string; products: unknown[] }[] | null }> {
  return apiFetchWithAuth("/api/microstores/suggest-products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Generate cover image for microstore (allowed creators). */
export function generateMicrostoreCoverUser(body: {
  name: string;
  description?: string;
  vibe?: string;
  trends?: string;
  categories?: string;
  referenceImageUrl?: string;
}): Promise<{ imageUrl: string | null }> {
  return apiFetchWithAuth<{ imageUrl: string | null }>("/api/microstores/generate-cover", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Submit microstore for approval (owner or admin). Store must be draft. */
export function submitMicrostoreForApprovalUser(id: string): Promise<MicrostoreDetail> {
  return apiFetchWithAuth<MicrostoreDetail>(`/api/microstores/${encodeURIComponent(id)}/submit-for-approval`, {
    method: "POST",
  });
}

/** Upload cover image for microstore (owner or admin). Stores under public prefix so cover loads without auth. */
export async function uploadMicrostoreCover(storeId: string, file: File): Promise<{ coverImageUrl: string }> {
  const token = getStoredToken();
  const form = new FormData();
  form.append("file", file);
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/microstores/${encodeURIComponent(storeId)}/upload-cover`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || "Upload failed");
  }
  return res.json() as Promise<{ coverImageUrl: string }>;
}

/** Update microstore (owner or admin). */
export function updateMicrostoreUser(
  id: string,
  body: Partial<{
    name: string;
    description: string;
    vibe: string;
    trends: string;
    categories: string;
    coverImageUrl: string;
    styleNotes: unknown;
    sections: { label: string; productIds: string[] }[];
  }>
): Promise<MicrostoreDetail> {
  return apiFetchWithAuth<MicrostoreDetail>(`/api/microstores/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
