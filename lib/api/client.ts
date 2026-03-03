import { getStoredToken } from "@/lib/auth/storage";

const DEFAULT_API_BASE = "http://localhost:3002";

/** Base URL for API and storage (used by apiFetch and by resolveMicrostoreCoverUrl). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
const BASE = API_BASE_URL;

if (typeof window !== "undefined" && process.env.NODE_ENV === "production" && API_BASE_URL === DEFAULT_API_BASE) {
  console.warn(
    "[HangerFashionStore] NEXT_PUBLIC_API_BASE_URL is unset; using default. Set it in production for correct API and image URLs."
  );
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Same as apiFetch but attaches stored token. Use for protected (admin/brand) endpoints. */
export async function apiFetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  return apiFetch<T>(path, { ...options, token: token ?? undefined });
}
