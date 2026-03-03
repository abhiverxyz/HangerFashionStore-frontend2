/**
 * Resolve image URL for display. Our storage (R2 or /uploads) goes through the access endpoint
 * so the backend can return a presigned or local URL after permission check.
 */
const DEFAULT_API_BASE = "http://localhost:3002";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;

function isOurStorageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const u = url.trim();
  if (u.startsWith("/")) return true;
  if (u.includes("r2.cloudflarestorage.com")) return true;
  if (u.startsWith(API_BASE)) return true;
  return false;
}

/** Public keys (e.g. admin-test/*, generated/*) don't require auth; can load without access token. */
function isPublicStorageKey(url: string): boolean {
  return url.includes("admin-test/") || url.includes("generated/");
}

/**
 * Return the URL to use for <img src> for a given imageUrl from our API.
 * For our storage (relative, R2, or same-origin) returns the access endpoint URL;
 * for external URLs (e.g. Shopify CDN) returns the URL as-is.
 * Pass accessToken for cross-origin private images (from useStorageAccessToken).
 * When our storage and no token: returns "" so caller shows placeholder until token is ready (avoids 401 on first paint).
 */
export function getImageDisplayUrl(
  imageUrl: string | null | undefined,
  accessToken?: string | null
): string {
  if (!imageUrl || typeof imageUrl !== "string") return "";
  const u = imageUrl.trim();
  if (!u) return "";
  if (!isOurStorageUrl(u)) return u;
  // Backend urlToStorageKey expects relative "/uploads/..." or R2 full URL; pass URL as-is so relative stays relative
  const encoded = encodeURIComponent(u);
  let out = `${API_BASE}/api/storage/access?url=${encoded}`;
  if (accessToken) out += `&access_token=${encodeURIComponent(accessToken)}`;
  else if (!isPublicStorageKey(u)) return ""; // private storage without token → show placeholder
  return out;
}
