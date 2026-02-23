import { apiFetchWithAuth } from "./client";

/**
 * Track a Find/browse page visit (no search). Fire-and-forget; do not await for rendering.
 * Used for visit-based personalization refresh. Backend records UserEvent with eventType "find_visit".
 */
export function trackFindVisit(): void {
  void apiFetchWithAuth<{ success: boolean }>("/api/analytics/track", {
    method: "POST",
    body: JSON.stringify({ eventType: "find_visit" }),
  }).catch(() => {
    // Fire-and-forget: ignore errors so Find page load is never blocked
  });
}
