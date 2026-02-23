import { getStoredToken } from "@/lib/auth/storage";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export interface UserImageRecord {
  id: string;
  userId: string;
  rawImageUrl: string;
  context?: string | null;
  createdAt: string;
}

/**
 * Upload a single image for the current user (e.g. for chat attachments).
 * POST /api/user-images/upload — multipart; returns record with rawImageUrl.
 */
export async function uploadUserImage(file: File): Promise<UserImageRecord> {
  const token = getStoredToken();
  const form = new FormData();
  form.append("file", file);

  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // Do not set Content-Type; browser sets multipart/form-data with boundary

  const res = await fetch(`${BASE}/api/user-images/upload`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || "Upload failed");
  }

  return res.json() as Promise<UserImageRecord>;
}
