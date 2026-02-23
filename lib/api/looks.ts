import { apiFetchWithAuth } from "./client";

export interface LookImage {
  id: string;
  lookId: string;
  imageUrl: string;
  avatarType: string;
  status: string;
  generatedAt?: string;
}

export interface Look {
  id: string;
  userId: string | null;
  lookData: string;
  imageUrl: string | null;
  vibe: string | null;
  occasion: string | null;
  createdAt: string;
  updatedAt: string;
  images?: LookImage[];
}

export interface LookDataParsed {
  comment?: string | null;
  vibe?: string | null;
  occasion?: string | null;
  timeOfDay?: string | null;
  labels?: string[];
  itemsSummary?: unknown[];
  analysisComment?: string | null;
  suggestions?: string[];
  classificationTags?: string[];
}

export interface LookWithParsed extends Look {
  lookDataParsed?: LookDataParsed;
}

export interface ListLooksResponse {
  items: Look[];
  total: number;
}

export interface AnalyzeLookResponse {
  comment: string;
  vibe: string | null;
  occasion: string | null;
  timeOfDay: string | null;
  labels: string[];
  analysisComment: string;
  suggestions: string[];
  lookId: string;
  look: Look;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export function listLooks(params?: { userId?: string; limit?: number; offset?: number }): Promise<ListLooksResponse> {
  const sp = new URLSearchParams();
  if (params?.userId) sp.set("userId", params.userId);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString();
  return apiFetchWithAuth<ListLooksResponse>(`/api/looks${q ? `?${q}` : ""}`);
}

export function getLook(id: string): Promise<Look> {
  return apiFetchWithAuth<Look>(`/api/looks/${encodeURIComponent(id)}`);
}

/**
 * Analyze a look: upload image file(s) or pass imageUrl/lookId.
 * For file upload use analyzeLookWithFile. For URL or re-analyze use this with body.
 */
export function analyzeLook(body: { imageUrl?: string; lookId?: string }): Promise<AnalyzeLookResponse> {
  return apiFetchWithAuth<AnalyzeLookResponse>("/api/looks/analyze", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Analyze a look by uploading a file (multipart). Auth required.
 */
export async function analyzeLookWithFile(file: File): Promise<AnalyzeLookResponse> {
  const token = (await import("@/lib/auth/storage")).getStoredToken();
  const form = new FormData();
  form.append("file", file);

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api/looks/analyze`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || "Analysis failed");
  }
  return res.json() as Promise<AnalyzeLookResponse>;
}

export function createLook(body: {
  lookData?: string;
  imageUrl?: string | null;
  vibe?: string | null;
  occasion?: string | null;
  userId?: string;
}): Promise<Look> {
  return apiFetchWithAuth<Look>("/api/looks", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateLook(
  id: string,
  body: Partial<{ lookData: string; imageUrl: string | null; vibe: string | null; occasion: string | null }>
): Promise<Look> {
  return apiFetchWithAuth<Look>(`/api/looks/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteLook(id: string): Promise<void> {
  return apiFetchWithAuth<void>(`/api/looks/${encodeURIComponent(id)}`, { method: "DELETE" });
}
